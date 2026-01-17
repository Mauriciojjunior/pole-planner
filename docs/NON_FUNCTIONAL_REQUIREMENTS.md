# Non-Functional Requirements Implementation

## 1. Structured Logging Strategy

All edge functions use JSON structured logging:

```typescript
interface LogEntry {
  timestamp: string;      // ISO 8601 format
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: {
    request_id?: string;
    tenant_id?: string;
    user_id?: string;
    duration_ms?: number;
    [key: string]: unknown;
  };
}
```

### Log Levels:
- **DEBUG**: Detailed diagnostic information
- **INFO**: General operational events (requests, completions)
- **WARN**: Non-critical issues (retries, deprecations)
- **ERROR**: Failures requiring attention

### Best Practices:
- Every request gets a unique `request_id`
- Include `tenant_id` for multi-tenant queries
- Log duration for performance tracking
- Never log sensitive data (passwords, tokens, PII)

---

## 2. Metrics List

### Request Metrics
| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `http_requests_total` | Counter | `method`, `endpoint`, `status` | Total HTTP requests |
| `http_request_duration_ms` | Histogram | `method`, `endpoint` | Request latency |
| `http_errors_total` | Counter | `method`, `endpoint`, `error_type` | Error count |

### Business Metrics
| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `bookings_created` | Counter | `tenant_id`, `status` | Bookings created |
| `bookings_cancelled` | Counter | `tenant_id`, `reason` | Booking cancellations |
| `classes_scheduled` | Counter | `tenant_id` | Classes created |
| `subscriptions_created` | Counter | `tenant_id`, `plan_type` | New subscriptions |
| `subscriptions_expired` | Counter | `tenant_id` | Expired subscriptions |

### Job Metrics
| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `jobs_processed` | Counter | `type`, `status` | Jobs processed |
| `jobs_failed` | Counter | `type`, `error` | Failed jobs |
| `job_processing_duration_ms` | Histogram | `type` | Job execution time |
| `jobs_queue_size` | Gauge | `status` | Current queue size |

### Notification Metrics
| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `emails_sent` | Counter | `template`, `status` | Emails sent |
| `webhooks_delivered` | Counter | `status` | Webhook deliveries |
| `notifications_created` | Counter | `type`, `channel` | Notifications |

---

## 3. Audit Logs

### Audited Actions
- **Authentication**: login, logout, password_reset
- **User Management**: create, update, delete, role_change
- **Teacher Actions**: approve, reject, block, unblock
- **Booking Actions**: create, update, cancel, approve, reject
- **Subscription Actions**: create, renew, cancel, expire
- **Data Access**: export, deletion_request

### Audit Log Schema
```sql
audit_logs (
  id, tenant_id, entity_type, entity_id,
  action, actor_id, actor_type,
  old_values, new_values,
  ip_address, user_agent,
  created_at
)
```

---

## 4. Data Retention Policy

| Data Type | Retention | Strategy | Justification |
|-----------|-----------|----------|---------------|
| Audit Logs | 365 days | Archive | Legal compliance |
| Events | 90 days | Hard delete | Operational data |
| Job History | 30 days | Hard delete | Debugging only |
| Webhook Deliveries | 30 days | Hard delete | Debugging only |
| Notifications (read) | 90 days | Hard delete | User preference |
| Metrics | 90 days | Hard delete | Trend analysis |

### Automated Cleanup
- Daily cron job via `observability?action=apply-retention`
- Configurable per table in `data_retention_policies`

---

## 5. LGPD Compliance (Brazilian Data Protection)

### Data Subject Rights (Art. 18)

| Right | Endpoint | Implementation |
|-------|----------|----------------|
| Access | `GET /observability?action=export-data` | Full data export |
| Portability | `GET /observability?action=export-data` | JSON format |
| Deletion | `POST /observability?action=request-deletion` | 30-day grace period |
| Correction | User profile update endpoints | Self-service |

### Deletion Process
1. User requests deletion
2. 30-day grace period (can cancel)
3. Automated execution after grace period
4. Full cascade delete of user data
5. Audit log retained (anonymized)

### Data Export Contents
- Profile information
- Teacher/Student data
- Booking history
- Subscription history
- Notification history

---

## 6. Security Checklist

### Authentication & Authorization
- [x] JWT-based authentication
- [x] Role-based access control (admin, teacher, student)
- [x] Tenant isolation (tenant_id on all queries)
- [x] Session management via Supabase Auth

### Data Protection
- [x] RLS enabled on all tables
- [x] Encrypted sensitive fields (address, phone)
- [x] No PII in logs
- [x] HTTPS only (Supabase enforced)

### Input Validation
- [x] Zod schema validation on frontend
- [x] Type checking in edge functions
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (React escaping)

### API Security
- [x] CORS headers configured
- [x] Rate limiting (Supabase built-in)
- [x] Request size limits
- [x] Webhook signature verification (HMAC)

### Monitoring & Incident Response
- [x] Structured logging
- [x] Error tracking
- [x] Audit trail
- [x] Metrics collection

---

## API Endpoints Summary

### Observability Edge Function
```
GET  /observability?action=health           # Health check
POST /observability?action=record-metric    # Record metric
POST /observability?action=apply-retention  # Run retention (cron)
POST /observability?action=export-data      # Export user data (LGPD)
POST /observability?action=request-deletion # Request deletion (LGPD)
POST /observability?action=cancel-deletion  # Cancel deletion
GET  /observability?action=deletion-status  # Check deletion status
GET  /observability?action=metrics          # Get metrics summary
GET  /observability?action=audit-logs       # Get audit logs
```
