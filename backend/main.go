package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var db *pgxpool.Pool

type Claim struct {
	ID                  string          `json:"id"`
	Store               string          `json:"store"`
	Type                string          `json:"type"`
	OtherType           *string         `json:"otherType,omitempty"`
	Severity            string          `json:"severity"`
	Date                string          `json:"date"`
	Description         string          `json:"description"`
	ResponsibleArea     string          `json:"responsibleArea"`
	TenantNotified      bool            `json:"tenantNotified"`
	ResponsibleNotified bool            `json:"responsibleAreaNotified"`
	EmployeeName        *string         `json:"employeeName,omitempty"`
	EmployeeContact     *string         `json:"employeeContact,omitempty"`
	Status              string          `json:"status"`
	Files               []string        `json:"files"`
	IrregularPolicy     bool            `json:"irregularPolicy"`
	AuditTrail          json.RawMessage `json:"auditTrail"`
}

func main() {
	ctx := context.Background()
	var err error
	db, err = dbConnection(ctx)
	if err != nil {
		log.Fatalf("failed to connect to db: %v", err)
	}
	defer db.Close()

	if err := ensureSchema(ctx); err != nil {
		log.Fatalf("schema error: %v", err)
	}

	r := gin.Default()
	// Simple CORS for development
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	{
		api.GET("/claims", getClaims)
		api.GET("/claims/:id", getClaimByID)
		api.POST("/claims", createClaim)
		api.PUT("/claims/:id", updateClaim)
		api.POST("/claims/:id/audit", addAuditEntry)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}

func dbConnection(ctx context.Context) (*pgxpool.Pool, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:123456@localhost:5432/prototipo01?sslmode=disable"
	}
	return pgxpool.New(ctx, dsn)
}

func ensureSchema(ctx context.Context) error {
	// Create a v2 table that stores richer claim data as JSONB when appropriate
	_, err := db.Exec(ctx, `CREATE TABLE IF NOT EXISTS claims_v2 (
        id TEXT PRIMARY KEY,
        store TEXT,
        type TEXT,
        other_type TEXT,
        severity TEXT,
        date TEXT,
        description TEXT,
        responsible_area TEXT,
        tenant_notified BOOLEAN DEFAULT false,
        responsible_notified BOOLEAN DEFAULT false,
        employee_name TEXT,
        employee_contact TEXT,
        status TEXT,
        files JSONB DEFAULT '[]'::jsonb,
        irregular_policy BOOLEAN DEFAULT false,
        audit_trail JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`)
	return err
}

func getClaims(c *gin.Context) {
	ctx := context.Background()
	rows, err := db.Query(ctx, `SELECT id, store, type, other_type, severity, date, description, responsible_area, tenant_notified, responsible_notified, employee_name, employee_contact, status, files, irregular_policy, audit_trail FROM claims_v2 ORDER BY created_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var list []Claim
	for rows.Next() {
		var it Claim
		var files sql.NullString
		var audit sql.NullString
		var other sql.NullString
		var empName sql.NullString
		var empContact sql.NullString
		if err := rows.Scan(&it.ID, &it.Store, &it.Type, &other, &it.Severity, &it.Date, &it.Description, &it.ResponsibleArea, &it.TenantNotified, &it.ResponsibleNotified, &empName, &empContact, &it.Status, &files, &it.IrregularPolicy, &audit); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if other.Valid {
			ot := other.String
			it.OtherType = &ot
		}
		if empName.Valid {
			it.EmployeeName = &empName.String
		}
		if empContact.Valid {
			it.EmployeeContact = &empContact.String
		}
		if files.Valid {
			it.Files = []string{}
			_ = json.Unmarshal([]byte(files.String), &it.Files)
		}
		if audit.Valid {
			it.AuditTrail = json.RawMessage(audit.String)
		} else {
			it.AuditTrail = json.RawMessage("[]")
		}
		list = append(list, it)
	}
	c.JSON(http.StatusOK, list)
}

func createClaim(c *gin.Context) {
	var in Claim
	if err := c.BindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx := context.Background()
	// generate ID like SIN-2026-XXXX
	year := time.Now().Year()
	uid := uuid.New().String()[0:6]
	sinID := fmt.Sprintf("SIN-%d-%s", year, uid)
	in.ID = sinID
	if in.Status == "" {
		in.Status = "Em análise"
	}
	filesB, _ := json.Marshal(in.Files)
	auditB := in.AuditTrail
	if len(auditB) == 0 {
		auditB = json.RawMessage("[]")
	}

	_, err := db.Exec(ctx, `INSERT INTO claims_v2 (id, store, type, other_type, severity, date, description, responsible_area, tenant_notified, responsible_notified, employee_name, employee_contact, status, files, irregular_policy, audit_trail) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`, in.ID, in.Store, in.Type, in.OtherType, in.Severity, in.Date, in.Description, in.ResponsibleArea, in.TenantNotified, in.ResponsibleNotified, in.EmployeeName, in.EmployeeContact, in.Status, filesB, in.IrregularPolicy, auditB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, in)
}

func getClaimByID(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()
	row := db.QueryRow(ctx, `SELECT id, store, type, other_type, severity, date, description, responsible_area, tenant_notified, responsible_notified, employee_name, employee_contact, status, files, irregular_policy, audit_trail FROM claims_v2 WHERE id=$1`, id)
	var it Claim
	var files sql.NullString
	var audit sql.NullString
	var other sql.NullString
	var empName sql.NullString
	var empContact sql.NullString
	if err := row.Scan(&it.ID, &it.Store, &it.Type, &other, &it.Severity, &it.Date, &it.Description, &it.ResponsibleArea, &it.TenantNotified, &it.ResponsibleNotified, &empName, &empContact, &it.Status, &files, &it.IrregularPolicy, &audit); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if other.Valid {
		ot := other.String
		it.OtherType = &ot
	}
	if empName.Valid {
		it.EmployeeName = &empName.String
	}
	if empContact.Valid {
		it.EmployeeContact = &empContact.String
	}
	if files.Valid {
		_ = json.Unmarshal([]byte(files.String), &it.Files)
	}
	if audit.Valid {
		it.AuditTrail = json.RawMessage(audit.String)
	} else {
		it.AuditTrail = json.RawMessage("[]")
	}
	c.JSON(http.StatusOK, it)
}

func updateClaim(c *gin.Context) {
	id := c.Param("id")
	var updates map[string]interface{}
	if err := c.BindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx := context.Background()
	// build simple update for known fields
	if status, ok := updates["status"].(string); ok {
		_, err := db.Exec(ctx, `UPDATE claims_v2 SET status=$1 WHERE id=$2`, status, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	if resp, ok := updates["responsibleArea"].(string); ok {
		_, err := db.Exec(ctx, `UPDATE claims_v2 SET responsible_area=$1 WHERE id=$2`, resp, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func addAuditEntry(c *gin.Context) {
	id := c.Param("id")
	var entry interface{}
	if err := c.BindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx := context.Background()
	// append to audit_trail JSONB
	b, _ := json.Marshal(entry)
	_, err := db.Exec(ctx, `UPDATE claims_v2 SET audit_trail = COALESCE(audit_trail, '[]'::jsonb) || $1::jsonb WHERE id=$2`, string(b), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
