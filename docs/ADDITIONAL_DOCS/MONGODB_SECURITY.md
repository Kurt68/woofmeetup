# 🔒 MongoDB Atlas Security Configuration Guide

Complete guide for configuring MongoDB Atlas with production-grade security for Woof Meetup.

---

## 📋 Overview

This guide covers the five critical MongoDB security configurations:

1. ✅ **User Authentication** - Strong credentials with role-based access
2. ✅ **Network IP Whitelist** - Control who can connect
3. ✅ **Encrypted Connections (TLS)** - Secure data in transit
4. ✅ **Automated Backups** - Disaster recovery
5. ✅ **Encryption at Rest** - Secure data on disk

---

## 1️⃣ User Authentication Setup

### Current Status

Your MongoDB Atlas is already using authenticated connections via the connection string:

```
mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net/...
```

### Verify Authentication is Configured

**In MongoDB Atlas Dashboard:**

1. Go to **Dashboard** → **Clusters** → **your-cluster**
2. Click **Security** → **Database Access**
3. Verify users exist:
   - ✅ Production user
   - ✅ Development user (if needed)

### Create Separate Database Users

**For Production:**

1. **Database Access** → **Add New Database User**

   - **Username:** `your-prod-username`
   - **Password:** Generate strong password (32+ chars, mix of upper/lower/numbers/symbols)
   - **Database User Privileges:**
     - Role: `Read and Write to any database`
   - **Click Add User**

2. **Copy the connection string:**

   ```
   mongodb+srv://USERNAME:<PASSWORD>@YOUR_CLUSTER.mongodb.net/app-data?retryWrites=true&w=majority
   ```

3. Update `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://USERNAME:<PASSWORD>@YOUR_CLUSTER.mongodb.net/app-data?retryWrites=true&w=majority&appName=Cluster0
   ```

**For Development (if using Atlas):**

1. Create a development-only user:

   - **Username:** `your-dev-username`
   - **Password:** Different strong password
   - **Database User Privileges:** Same as production

2. Add to `.env.development`:
   ```env
   MONGODB_URI=mongodb+srv://USERNAME:<PASSWORD>@YOUR_CLUSTER.mongodb.net/app-data?retryWrites=true&w=majority
   ```

### Password Best Practices

- ✅ Minimum 32 characters
- ✅ Mix uppercase, lowercase, numbers, symbols
- ✅ Store in password manager
- ✅ Rotate every 90 days
- ✅ Never commit to version control
- ✅ Different password for dev vs. production

**Example strong password:**

```
K7$mQxL9@pBv2JeW5cR#nF8TgH4sD1aZx
```

---

## 2️⃣ Network IP Whitelist Configuration

### Development Setup (Allow from anywhere locally)

1. **Network Access** → **IP Whitelist**
2. **Add IP Address**
   - **Access List Entry:** `0.0.0.0/0` (allows any IP)
   - **Comment:** `Development - local testing`
   - **Click Confirm**

⚠️ **Only for development!** This is not secure for production.

### Production Setup (Specific IPs only)

1. **Network Access** → **IP Whitelist**
2. **Delete** the `0.0.0.0/0` entry if it exists
3. **Add IP Address** for each production server:
   - **Access List Entry:** `YOUR_PRODUCTION_SERVER_IP/32`
   - **Comment:** `Production server`
   - **Click Confirm**

**To find your production server IP:**

```bash
# If deployed on AWS/cloud provider
# Find it in your hosting dashboard

# For home/office servers
curl https://ifconfig.me
```

### Multiple Server Setup

If you have multiple servers, add each one:

```
✅ Production Server 1: 203.0.113.45/32
✅ Production Server 2: 198.51.100.89/32
✅ CI/CD Pipeline: 192.0.2.150/32
❌ 0.0.0.0/0 (removed for production)
```

### CI/CD Integration

If using GitHub Actions or other CI/CD:

1. Find your CI/CD runner IP
2. Add it to the whitelist:
   - **Access List Entry:** `CI_RUNNER_IP/32`
   - **Comment:** `GitHub Actions pipeline`

---

## 3️⃣ Encrypted Connections (TLS) - Already Enabled ✅

### Current Status

Your connection string uses `mongodb+srv://` which automatically enables TLS encryption.

```
mongodb+srv://USERNAME@YOUR_CLUSTER.mongodb.net/...
```

This means:

- ✅ Encrypted connection (TLS 1.2+)
- ✅ Certificate validation
- ✅ Secure data in transit

### Verify TLS is Active

1. **MongoDB Atlas Dashboard** → **Security** → **Advanced Settings**
2. Confirm **Encryption in Transit** shows:
   ```
   TLS Version: 1.2
   Status: ✅ Enabled
   ```

### For Additional Security (Mutual TLS - Optional)

If you want mutual TLS (both client and server authenticate):

1. **Security** → **Advanced Settings** → **Mutual TLS**
2. Enable and follow the certificate generation steps
3. Update your Node.js connection code to include client certificates

**In `server/index.js` (if using mTLS):**

```javascript
import fs from 'fs'

const options = {
  cert: fs.readFileSync('./certs/client.crt'),
  key: fs.readFileSync('./certs/client.key'),
  ca: [fs.readFileSync('./certs/ca.pem')],
}

const client = new MongoClient(process.env.MONGODB_URI, {
  sslValidate: true,
  sslCA: options.ca,
  sslCert: options.cert,
  sslKey: options.key,
})
```

---

## 4️⃣ Automated Backups Configuration

### MongoDB Atlas Automated Backups (Included)

MongoDB Atlas automatically backs up your data. Configure backup retention:

1. **Cluster** → **Backup** tab
2. **Backup Settings** (gear icon)
3. Configure retention policy:

**Development:**

- **Backup Interval:** 24 hours
- **Retention Days:** 7 days (minimum)
- **Click Save**

**Production:**

- **Backup Interval:** Every 6 hours (recommended)
- **Retention Days:** 30-90 days
- **Backup Window:** Off-peak hours (e.g., 2-4 AM)
- **Click Save**

### View Backup History

1. **Backup** tab → **Snapshots**
2. Shows all automatic backups
3. Click snapshot to restore or download

### Restore from Backup

**To restore a specific backup:**

1. **Backup** → **Snapshots**
2. Find snapshot by date/time
3. Click **...** → **Restore**
4. Choose restore target:
   - Restore to same cluster (destructive)
   - Restore to new cluster (safe, recommended)
5. Click **Restore**

⚠️ **For production restores, always use a new cluster first to verify data**

### Backup Encryption

1. **Backup** → **Backup Settings**
2. Verify **Backup Encryption** is:
   ```
   ✅ Enabled with AWS KMS
   ```

This encrypts backups at rest in S3.

### Download Backups to Local Storage

1. **Backup** → **Snapshots**
2. Click snapshot → **Download**
3. Backups are encrypted and stored locally

**For automated local backups, see section 6 below**

---

## 5️⃣ Encryption at Rest - Already Enabled ✅

### Current Status

MongoDB Atlas M1+ clusters include encryption at rest by default.

**Verify it's enabled:**

1. **Cluster** → **Security** → **Advanced Settings**
2. Check **Encryption at Rest**:
   ```
   ✅ AWS KMS Encryption Enabled
   Status: ACTIVE
   Key Rotation: Automatic
   ```

### For Higher Security (Bring Your Own Key - BYOK)

If you want to manage encryption keys yourself:

1. **Security** → **Advanced Settings** → **Encryption at Rest**
2. Click **Use Your Own Encryption Key (BYOK)**
3. Set up AWS KMS key:
   - Create AWS KMS Master Key
   - Grant MongoDB Atlas access
   - Configure key rotation
4. Follow MongoDB's setup wizard

**This is optional but recommended for:**

- ✅ Highly sensitive data
- ✅ Regulatory compliance (HIPAA, PCI-DSS)
- ✅ Extra security requirements

---

## 6️⃣ Additional Security Recommendations

### 1. Enable IP Access Restrictions

**Already configured above** - only allows approved IPs.

### 2. Database Audit Logging

1. **Security** → **Audit Logs**
2. Configure what to log:
   - ✅ Authentication events
   - ✅ Administrative operations
   - ✅ Query operations
3. Keep audit logs for compliance

### 3. VPC Peering (Advanced)

For maximum security, use VPC peering so traffic never goes over the internet:

1. **Security** → **Network Access** → **Peering**
2. Follow VPC peering setup guide
3. Update connection string to use private endpoint

### 4. Enable Database Activity Alerts

1. **Alerts** → **Create Alert Policy**
2. Set up alerts for:
   - Unusual access patterns
   - Failed authentication attempts
   - Backup failures
   - High CPU/memory usage

### 5. Connection String Best Practices

```javascript
// ✅ GOOD - Uses environment variable
const mongoUri = process.env.MONGODB_URI

// ❌ BAD - Hardcoded credentials
const mongoUri = 'mongodb+srv://user:pass@cluster.net/db'

// ✅ GOOD - Uses standard connection params
const options = {
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
}

// ✅ GOOD - Sets timeout for production
const options = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}
```

---

## 7️⃣ Production Checklist

```
✅ User Authentication
  [ ] Strong password (32+ chars) for production user
  [ ] Separate dev/prod users
  [ ] Password stored securely
  [ ] Passwords rotated every 90 days

✅ Network IP Whitelist
  [ ] 0.0.0.0/0 removed from production
  [ ] Only production server IPs whitelisted
  [ ] CI/CD pipeline IP added if needed
  [ ] Documentation of all approved IPs

✅ Encrypted Connections (TLS)
  [ ] Connection string uses mongodb+srv://
  [ ] TLS 1.2+ confirmed
  [ ] Certificate validation enabled
  [ ] (Optional) Mutual TLS configured

✅ Automated Backups
  [ ] Backup interval: 6 hours (production)
  [ ] Retention: 30-90 days
  [ ] Encryption: Enabled with AWS KMS
  [ ] Backup window: Off-peak hours
  [ ] Restore tested at least once

✅ Encryption at Rest
  [ ] AWS KMS encryption confirmed
  [ ] Key rotation: Automatic
  [ ] (Optional) BYOK configured if required
  [ ] Audit logging enabled
```

---

## 8️⃣ Environment Variables

### Root `.env` (Production)

```env
# MongoDB Atlas Production - Change both user and password
MONGODB_URI=mongodb+srv://USERNAME:YOUR_STRONG_PASSWORD@YOUR_CLUSTER.mongodb.net/app-data?retryWrites=true&w=majority&appName=Cluster0

# MongoDB Connection Options
MONGODB_MAX_POOL_SIZE=10
MONGODB_TIMEOUT_MS=5000

# Ensure Node.js is set to production
NODE_ENV=production
```

### `.env.development` (Development)

```env
# MongoDB Atlas Development - Can be more permissive
MONGODB_URI=mongodb+srv://USERNAME:YOUR_DEV_PASSWORD@YOUR_CLUSTER.mongodb.net/app-data?retryWrites=true&w=majority&appName=Cluster0

NODE_ENV=development
```

---

## 9️⃣ Monitoring & Alerts

### Set Up MongoDB Atlas Alerts

1. **Alerts** → **Alert Settings**
2. Add alert email: your-team@woof-meetup.com
3. Create alerts for:

| Alert                   | Threshold   | Action      |
| ----------------------- | ----------- | ----------- |
| Connection exceeded     | 90% of max  | Page oncall |
| Replication lag         | > 10s       | Investigate |
| Backup failed           | Any failure | Page oncall |
| High CPU                | > 80%       | Scale up    |
| Disk space              | > 80%       | Scale up    |
| Authentication failures | > 10/min    | Investigate |

### Monitor via Logs

**In your Node.js app:**

```javascript
import { logger } from './utilities/logger.js'

mongoose.connection.on('error', (err) => {
  logger.logError('MongoDB connection error', err)
  // Alert team
})

mongoose.connection.on('disconnected', () => {
  logger.logWarning('MongoDB disconnected')
})

mongoose.connection.on('reconnected', () => {
  logger.logInfo('MongoDB reconnected')
})
```

---

## 🔟 Quick Reference

| Configuration    | Dev                        | Prod                | Status       |
| ---------------- | -------------------------- | ------------------- | ------------ |
| **User Auth**    | dev-username               | prod-username       | ✅ Configure |
| **IP Whitelist** | 0.0.0.0/0                  | Server IP only      | ✅ Configure |
| **TLS**          | mongodb+srv://             | mongodb+srv://      | ✅ Active    |
| **Backups**      | 24h interval, 7d retention | 6h interval, 30-90d | ✅ Configure |
| **Encryption**   | AWS KMS default            | AWS KMS default     | ✅ Active    |

---

## Support & Resources

- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/
- **Security Best Practices:** https://docs.atlas.mongodb.com/security/
- **Network Access:** https://docs.atlas.mongodb.com/security/ip-access-list/
- **Backup & Restore:** https://docs.atlas.mongodb.com/backup/

---

**Last Updated:** 2025
**Status:** Ready for production deployment
