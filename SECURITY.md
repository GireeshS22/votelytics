# 🔒 Security Features - Votelytics API

## Overview

The Votelytics API implements multiple layers of security to protect against common web vulnerabilities and ensure data integrity.

---

## ✅ Implemented Security Features

### 1. API Key Authentication

**Purpose**: Protect write operations from unauthorized access

**Implementation**:
- Admin API key required for all POST/PUT/DELETE operations
- GET requests remain public (election data is publicly accessible)
- API key passed via `X-Admin-Key` header

**Setup**:
```bash
# Generate a secure API key
python -c "import secrets; print('admin_' + secrets.token_urlsafe(32))"

# Add to server/.env
ADMIN_API_KEY=admin_<your-generated-key>
```

**Usage**:
```bash
# Protected endpoint example
curl -X POST http://localhost:8000/api/constituencies/ \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: admin_your-key-here" \
  -d '{"name":"New Constituency","code":"NC001","ac_number":999}'
```

**Security Level**: 🟢 MEDIUM
- Prevents unauthorized data modification
- Simple to implement and use
- Suitable for small team/single admin scenarios

---

### 2. Rate Limiting

**Purpose**: Prevent API abuse, DoS attacks, and excessive costs

**Implementation**:
- Based on IP address using `slowapi` library
- Different limits for different endpoint types

**Rate Limits**:
| Endpoint Type | Limit | Purpose |
|--------------|-------|---------|
| Public Read | 100 req/min | Normal data viewing |
| Heavy Queries | 20 req/min | Large result sets (all election results) |
| Admin Write | 500 req/min | Data modification operations |

**Configuration** (in `server/.env`):
```bash
RATE_LIMIT_PUBLIC=100/minute
RATE_LIMIT_HEAVY=20/minute
RATE_LIMIT_ADMIN=500/minute
```

**Security Level**: 🟢 HIGH
- Protects against brute force attacks
- Prevents server resource exhaustion
- Controls database connection usage and costs

---

### 3. CORS (Cross-Origin Resource Sharing)

**Purpose**: Control which domains can access the API

**Current Configuration**:
```python
# Development
allow_origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

# Allowed Methods
["GET", "POST", "PUT", "DELETE", "OPTIONS"]

# Allowed Headers
["Content-Type", "X-Admin-Key", "Authorization"]
```

**Production Setup**:
Update `server/app/config.py`:
```python
CORS_ORIGINS: List[str] = [
    "https://votelytics.in",
    "https://www.votelytics.in",
]
```

**Security Level**: 🟡 MEDIUM
- Prevents unauthorized domains from calling API
- Blocks CSRF attacks from malicious websites
- Must be updated before production deployment

---

### 4. Input Validation

**Purpose**: Ensure data quality and prevent injection attacks

**Implementation**:
- Pydantic field validators on all schemas
- Type checking enforced by FastAPI

**Examples**:
```python
# Year range validation
year: int  # Must be 1950-2050

# String length limits
name: str  # Max 200 characters

# Positive numbers only
total_seats: int  # Must be > 0

# Percentage ranges
voter_turnout_pct: float  # Must be 0-100
```

**Security Level**: 🟢 MEDIUM-HIGH
- Prevents SQL injection (via SQLAlchemy parameterization)
- Blocks XSS attacks (input sanitization)
- Ensures data consistency

---

## 🚧 Security Checklist for Production Deployment

### Before Going Live:

- [ ] **Rotate All Credentials**
  ```bash
  # Generate new admin API key
  python -c "import secrets; print('admin_' + secrets.token_urlsafe(32))"

  # Generate new SECRET_KEY
  openssl rand -hex 32
  ```

- [ ] **Update Environment Variables**
  - [ ] Set `ENV=production` in `.env`
  - [ ] Update `ADMIN_API_KEY` to new value
  - [ ] Update `SECRET_KEY` to cryptographically random value
  - [ ] Verify `DATABASE_URL` uses production database

- [ ] **Configure CORS for Production**
  - [ ] Add production domain(s) to `CORS_ORIGINS`
  - [ ] Remove localhost origins
  - [ ] Test frontend can still call API

- [ ] **Enable Supabase Row Level Security (RLS)**
  ```sql
  -- Enable RLS on all tables
  ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
  ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
  ALTER TABLE election_results ENABLE ROW LEVEL SECURITY;

  -- Create read policies
  CREATE POLICY "Public read access" ON constituencies
    FOR SELECT USING (true);

  -- Create write policies (service role only)
  CREATE POLICY "Service role write" ON constituencies
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
  ```

- [ ] **HTTPS Configuration**
  - [ ] Obtain SSL certificate (Let's Encrypt recommended)
  - [ ] Configure reverse proxy (Nginx/Caddy)
  - [ ] Force HTTPS redirects
  - [ ] Set HSTS headers

- [ ] **Security Headers**
  - [ ] Add `X-Content-Type-Options: nosniff`
  - [ ] Add `X-Frame-Options: DENY`
  - [ ] Add `Content-Security-Policy`

- [ ] **Monitoring & Logging**
  - [ ] Set up error logging (Sentry recommended)
  - [ ] Monitor rate limit violations
  - [ ] Track failed authentication attempts
  - [ ] Set up uptime monitoring

---

## 📊 Security Risk Assessment

### Current Security Level: 🟡 MEDIUM-HIGH

| Aspect | Status | Risk Level |
|--------|--------|-----------|
| Authentication | ✅ Implemented | 🟢 Low |
| Rate Limiting | ✅ Implemented | 🟢 Low |
| CORS | ⚠️ Dev only | 🟡 Medium |
| Input Validation | ✅ Implemented | 🟢 Low |
| HTTPS | ❌ Not configured | 🔴 High |
| RLS | ❓ Unknown | 🟡 Medium |
| Credentials | ⚠️ Need rotation | 🟡 Medium |

### Recommendations by Priority:

**P0 (Critical - Before Production)**:
1. Enable HTTPS with valid SSL certificate
2. Rotate all credentials (API keys, SECRET_KEY)
3. Configure production CORS origins
4. Enable Supabase RLS

**P1 (High - Within 1 Week)**:
5. Set up monitoring and logging
6. Implement security headers
7. Create incident response plan

**P2 (Medium - Nice to Have)**:
8. Add JWT-based user authentication
9. Implement API versioning
10. Set up automated security scanning

---

## 🔐 API Security Best Practices

### For Administrators:

1. **Never share your API key**
   - Treat it like a password
   - Rotate if compromised
   - Use environment variables, never hardcode

2. **Use HTTPS in production**
   - API keys transmitted in plain text over HTTP can be intercepted

3. **Monitor API usage**
   - Watch for unusual traffic patterns
   - Review rate limit violations
   - Check for failed authentication attempts

4. **Keep dependencies updated**
   ```bash
   cd server
   poetry update
   ```

### For Users/Developers:

1. **Never commit `.env` files**
   - Already in `.gitignore`
   - Use `.env.example` as template

2. **Use proper error handling**
   ```python
   try:
       response = requests.post(url, headers=headers)
       response.raise_for_status()
   except requests.exceptions.HTTPError as e:
       if e.response.status_code == 403:
           print("Authentication failed - check API key")
       elif e.response.status_code == 429:
           print("Rate limit exceeded - wait and retry")
   ```

3. **Respect rate limits**
   - Implement exponential backoff
   - Cache responses when possible
   - Batch operations efficiently

---

## 📝 Incident Response

### If API Key is Compromised:

1. **Immediately generate new key**:
   ```bash
   python -c "import secrets; print('admin_' + secrets.token_urlsafe(32))"
   ```

2. **Update `.env` file** with new key

3. **Restart API server**:
   ```bash
   cd server
   poetry run uvicorn app.main:app --reload
   ```

4. **Review API logs** for unauthorized usage

5. **Update any scripts/tools** using the old key

### If Under Attack:

1. **Identify attack source** (check logs)
2. **Temporarily block IP** (if specific source)
3. **Lower rate limits** temporarily
4. **Enable additional monitoring**
5. **Contact Supabase support** if database impacted

---

## 📚 Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [FastAPI Security Documentation](https://fastapi.tiangolo.com/tutorial/security/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth)

---

**Last Updated**: November 2, 2025
**Security Implementation**: Complete for Development
**Production Ready**: ⚠️ Requires configuration updates (see checklist above)
