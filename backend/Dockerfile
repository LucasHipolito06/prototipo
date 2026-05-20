FROM golang:1.20-alpine
WORKDIR /app
COPY go.mod .
RUN apk add --no-cache git
RUN go mod download
COPY . .
RUN go build -o /backend .
EXPOSE 8080
CMD ["/backend"]
