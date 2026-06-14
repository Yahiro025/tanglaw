---
name: api-design
description: REST API design for TANGLAW — Express endpoints, auth patterns, pagination, error responses, and LangChain integration
---

# TANGLAW API Design Patterns

REST API design conventions for the TANGLAW Express backend.

## When to Activate

- Adding or modifying API endpoints in `backend/src/routes/`
- Designing request/response shapes for scholarship, auth, or chat endpoints
- Implementing pagination, filtering, or sorting
- Handling error responses consistently

## Endpoint Conventions

### Base URL

Production: `https://tanglaw-api.onrender.com/api`
Development: `http://localhost:5000/api`

### Resource Naming

```
POST   /api/auth/signup     # Create account
POST   /api/auth/login      # Authenticate
POST   /api/auth/logout     # End session (auth required)
GET    /api/auth/me         # Current user info (auth required)
GET    /api/scholarships    # List scholarships (auth required, paginated)
POST   /api/messages        # Store chat message (auth required)
GET    /api/messages        # Get user's messages (auth required)
GET    /api/health          # Health check (public)
```

### Pagination

```typescript
// Query params: ?page=1&pageSize=10&program=STEM&gwa=1.5&sector=PUBLIC
// Response shape:
{
  scholarships: BackendScholarship[],
  total: number,
  page: number,
  pageSize: number
}
```

### Status Codes

| Code | When |
|------|------|
| 200 | Success (GET, POST that returns data) |
| 201 | Created (POST auth/signup) |
| 400 | Bad request (validation failure) |
| 401 | No auth token provided |
| 403 | Invalid or expired token |
| 404 | Resource not found |
| 500 | Server error |

### Error Response Shape

```typescript
// Always return:
{ error: "Human-readable error message" }
```

### Auth Header

```typescript
// Frontend sends JWT in Authorization header
Authorization: Bearer <jwt_token>
```
