# 🔐 MongoDB Atlas Security Setup - Complete Guide

**Status:** ✅ Ready for production deployment  
**Last Updated:** 2025  
**Version:** Production-Grade Configuration

---

## 📋 Summary

This guide provides complete instructions for configuring MongoDB Atlas with all required security features for the Woof Meetup application:

- ✅ **User Authentication** - Role-based database users
- ✅ **Network IP Whitelist** - Control access by IP
- ✅ **Encrypted Connections (TLS)** - Secure data in transit
- ✅ **Automated Backups** - Disaster recovery
- ✅ **Encryption at Rest** - Secure data on disk

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Interactive Setup

```bash
# Run the MongoDB security setup wizard
./shscripts/mongodb/setup-security.sh

# Follow the interactive prompts
```

### Option 2: Manual Configuration

Follow the detailed steps in `docs/MONGODB_SECURITY.md`

### Option 3: Environment Variables

1. Copy the template file:

   ```bash
   cp .env.mongodb.example .env.production
   ```

2. Edit `.env.production` with your MongoDB credentials

3. Update MONGODB_URI:
   ```env
   MONGODB_URI=mongodb+srv://USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/app-data?retryWrites=true&w=majority
   ```

---

## 📊 Current Status

### What's Already Configured ✅

| Feature               | Status    | Details                         |
| --------------------- | --------- | ------------------------------- |
| MongoDB Atlas Cluster | ✅ Active | YOUR_CLUSTER.mongodb.net        |
| TLS Encryption        | ✅ Active | mongodb+srv:// enabled          |
| Encryption at Rest    | ✅ Active | AWS KMS enabled by default      |
| Connection String     | ✅ Valid  | Using `mongodb+srv://` protocol |

### What Needs Configuration ⚙️

| Feature        | Dev       | Prod         | Timeline          |
| -------------- | --------- | ------------ | ----------------- |
| Database Users | Optional  | **REQUIRED** | Before deployment |
| IP Whitelist   | 0.0.0.0/0 | **REQUIRED** | Before deployment |
| Backups        | 24h/7d    | **REQUIRED** | Immediately       |
| Monitoring     | Optional  | **REQUIRED** | Before deployment |

---

## 🔑 1. User Authentication

### For Production

**Create a production database user in MongoDB Atlas:**

1. Go to **MongoDB Atlas Dashboard**
2. Click **Security** → **Database Access**
3. Click **Add New Database User**

**Configuration:**

- **Username:** `your-prod-username`
- **Password:** Generate strong password (32+ chars)
  - Example: `K7$mQxL9@pBv2JeW5cR#nF8TgH4sD1aZx`
- **Database User Privileges:**
  - Role: `Read and Write to any database`
- **Click Add User**

**Get Connection String:**

1. Click **Connect** button (top of page)
2. Select **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your strong password
5. Replace `<database>` with `app-data`

**Result:**

```
mongodb+srv://USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/app-data?retryWrites=true&w=majority
```

### For Development

**Create a development database user (optional):**

1. Repeat steps above
2. **Username:** `your-dev-username`
3. **Password:** Different strong password
4. Same privileges as production

**Or use local MongoDB:**

```
mongodb://localhost:27017/app-data
```

### Password Requirements

- ✅ Minimum 32 characters
- ✅ Mix uppercase, lowercase, numbers, symbols
- ✅ Store in password manager (1Password, Bitwarden, etc.)
- ✅ Never commit to git
- ✅ Rotate every 90 days

---

## 🌐 2. Network IP Whitelist

### For Development

**Allow local connections:**

1. Go to **Security** → **Network Access**
2. Click **Add IP Address**
3. **Access List Entry:** `0.0.0.0/0`
4. **Comment:** `Development - local testing`
5. **Click Confirm**

⚠️ **Only for development!** Remove before production.

### For Production

**Restrict to production servers only:**

1. Go to **Security** → **Network Access**
2. **Delete** the `0.0.0.0/0` entry
3. **Add IP Address** for production server:
   - **Access List Entry:** `YOUR_PRODUCTION_SERVER_IP/32`
   - **Comment:** `Production server`
   - **Click Confirm**

**Find your server IP:**

```bash
# AWS/Cloud instance
# Find in your hosting dashboard

# For home/office server
curl https://ifconfig.me
```

**Multiple servers:**

```
✅ Production Server 1: 203.0.113.45/32
✅ Production Server 2: 198.51.100.89/32
✅ CI/CD Pipeline: 192.0.2.150/32
```

---

## 🔒 3. Encrypted Connections (TLS)

### Current Status ✅ ACTIVE

Your connection string uses `mongodb+srv://` which automatically enables TLS:

```
mongodb+srv://USERNAME@YOUR_CLUSTER.mongodb.net/...
```

**This means:**

- ✅ TLS 1.2+ encryption enabled
- ✅ Certificate validation enabled
- ✅ Data encrypted in transit

**Verify in MongoDB Atlas:**

1. **Dashboard** → **Security** → **Advanced Settings**
2. Confirm: **TLS Version:** 1.2 ✅

### Optional: Mutual TLS (mTLS)

For extra security (client and server both authenticate):

1. **Security** → **Advanced Settings** → **Mutual TLS**
2. Enable and follow certificate generation
3. Update Node.js connection (see MONGODB_SECURITY.md)

---

## 💾 4. Automated Backups

### Configure Backup Policy

**In MongoDB Atlas:**

1. Go to **Backup** → **Backup Settings** (gear icon)

**For Development:**

- **Backup Interval:** Every 24 hours
- **Retention Days:** 7 days (minimum)
- **Click Save**

**For Production:**

- **Backup Interval:** Every 6 hours (recommended)
- **Retention Days:** 30-90 days (based on your needs)
- **Backup Window:** Off-peak hours (e.g., 2-4 AM)
- **Click Save**

### Verify Backup Encryption

1. **Backup** → **Backup Settings**
2. Confirm: **Backup Encryption** = ✅ Enabled with AWS KMS

### View & Restore Backups

**View backups:**

1. Go to **Backup** → **Snapshots**
2. See all automatic snapshots with timestamps

**Restore from backup:**

For production, ALWAYS restore to a new cluster first:

1. **Snapshots** → Find snapshot → **...** → **Restore**
2. **Restore to:** New cluster (not same cluster)
3. Verify data integrity
4. When ready, switch production to new cluster

---

## 🔐 5. Encryption at Rest

### Current Status ✅ ACTIVE

MongoDB Atlas M1+ clusters include encryption at rest by default.

**Verify in MongoDB Atlas:**

1. **Dashboard** → **Security** → **Advanced Settings**
2. Confirm: **Encryption at Rest**
   ```
   ✅ AWS KMS Encryption Enabled
   Status: ACTIVE
   Key Rotation: Automatic
   ```

### Optional: Bring Your Own Key (BYOK)

For highest security (manage keys yourself):

1. **Security** → **Advanced Settings** → **Encryption at Rest**
2. Enable **Use Your Own Encryption Key**
3. Set up AWS KMS key and grant access to MongoDB
4. Follow setup wizard

**Recommended for:**

- ✅ HIPAA compliance
- ✅ PCI-DSS compliance
- ✅ Highly sensitive data
- ✅ Extra security requirements

---

## ⚙️ Environment Variables

### Production Setup

Create `.env.production`:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/app-data?retryWrites=true&w=majority

# Connection Settings
MONGODB_MAX_POOL_SIZE=10
MONGODB_TIMEOUT_MS=5000
MONGODB_SOCKET_TIMEOUT_MS=45000

# Environment
NODE_ENV=production
```

### Development Setup

Create `.env.development` (or `.env` for local dev):

```env
# MongoDB Connection - Development
MONGODB_URI=mongodb+srv://USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/app-data?retryWrites=true&w=majority

# Or local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/app-data

# Environment
NODE_ENV=development
```

### Deployment

```bash
# Development
npm run dev

# Production build
npm run build
NODE_ENV=production npm start
```

---

## 🧪 Testing & Verification

### Test Connection

```bash
# Interactive test
./shscripts/mongodb/setup-security.sh --test-connection

# Or validate connection string
./shscripts/mongodb/setup-security.sh --validate-uri
```

### Check Configuration

```bash
# View current settings
./shscripts/mongodb/setup-security.sh --checklist
```

### From Node.js App

```javascript
import mongoose from 'mongoose'
import { logger } from './utilities/logger.js'

mongoose.connection.on('connected', () => {
  logger.logSuccess('MongoDB connected successfully')
})

mongoose.connection.on('error', (err) => {
  logger.logError('MongoDB connection error', err)
})

mongoose.connection.on('disconnected', () => {
  logger.logWarning('MongoDB disconnected')
})
```

---

## 📊 Monitoring & Alerts

### Set Up MongoDB Atlas Alerts

1. Go to **Alerts** → **Alert Settings**
2. Add email: `your-team@woof-meetup.com`
3. Create alerts for:

| Alert                | Threshold    | Action          |
| -------------------- | ------------ | --------------- |
| Connections exceeded | > 80% of max | Investigate     |
| Replication lag      | > 10 seconds | Investigate     |
| Backup failed        | Any failure  | Page on-call    |
| High CPU             | > 80%        | Scale up        |
| Disk space critical  | < 10GB       | Scale up        |
| Auth failures        | > 10/min     | Security review |

### Application Monitoring

In `server/index.js`:

```javascript
import { logger } from './utilities/logger.js'

mongoose.connection.on('error', (err) => {
  logger.logError('MongoDB error', err)
  sendAlert('MongoDB connection error')
})

mongoose.connection.on('reconnected', () => {
  logger.logInfo('MongoDB reconnected')
})
```

---

## ✅ Production Deployment Checklist

```
BEFORE DEPLOYMENT:

User Authentication
☐ Production user created (your-prod-username)
☐ Strong password (32+ chars) set
☐ Different from development password
☐ Stored securely (password manager)
☐ Connection string obtained and tested

Network IP Whitelist
☐ 0.0.0.0/0 REMOVED from production whitelist
☐ Production server IP added (/32 notation)
☐ CI/CD pipeline IP added (if needed)
☐ Only production IPs allowed
☐ All IPs documented

Encrypted Connections
☐ Connection string uses mongodb+srv://
☐ TLS 1.2+ verified in Atlas
☐ Certificate validation active

Automated Backups
☐ Backup interval set (6 hours for production)
☐ Retention configured (30-90 days)
☐ Backup window off-peak (2-4 AM)
☐ Encryption enabled (AWS KMS)
☐ Restore tested at least once

Encryption at Rest
☐ AWS KMS encryption confirmed
☐ Auto key rotation active
☐ (Optional) BYOK set up if required

Monitoring
☐ Alerts configured
☐ Alert emails set up
☐ Backup failure alerts active
☐ Connection threshold alerts active

Testing
☐ Connection tested with production URI
☐ Database query successful
☐ Data written and read correctly
☐ No console errors
☐ Backups verified

Documentation
☐ Connection details documented
☐ Password stored in team vault
☐ Backup/restore procedure documented
☐ On-call runbook updated
☐ Team training completed
```

---

## 🚨 Troubleshooting

### Connection Fails

**Check:**

1. IP is whitelisted in MongoDB Atlas
2. Credentials are correct
3. Network connectivity (firewall, VPN)
4. MongoDB Atlas cluster status

```bash
./shscripts/mongodb/setup-security.sh --test-connection
```

### Authentication Error

**Solutions:**

1. Verify username and password in connection string
2. Check password doesn't have special characters that need escaping
3. URL-encode special characters in password
4. Recreate user with simple password first to test

### High Latency

**Solutions:**

1. Check if backing up (backups slow queries)
2. Increase MONGODB_MAX_POOL_SIZE
3. Check CPU usage in MongoDB Atlas
4. Optimize slow queries

### Backup Failed

**Check:**

1. Verify backup encryption is enabled
2. Check disk space
3. Monitor backup status in Backup → Snapshots
4. Review alert emails

### Connection Pool Exhausted

**Solutions:**

1. Increase MONGODB_MAX_POOL_SIZE in .env
2. Review connection timeout settings
3. Check for connection leaks in app

---

## 📚 Resources

**Official Documentation:**

- MongoDB Atlas Security: https://docs.atlas.mongodb.com/security/
- Network Access: https://docs.atlas.mongodb.com/security/ip-access-list/
- Backup & Restore: https://docs.atlas.mongodb.com/backup/
- Encryption: https://docs.atlas.mongodb.com/encryption-at-rest/

**Related Files:**

- Detailed guide: `docs/MONGODB_SECURITY.md`
- Setup script: `shscripts/mongodb/setup-security.sh`
- Template: `.env.mongodb.example`

**Support:**

- MongoDB Support: https://support.mongodb.com/
- Woof Meetup Team: Your contact info here

---

## 🎯 Next Steps

1. **Run the setup script:**

   ```bash
   ./shscripts/mongodb/setup-security.sh
   ```

2. **Follow the interactive prompts** for your environment

3. **Test your connection:**

   ```bash
   ./shscripts/mongodb/setup-security.sh --test-connection
   ```

4. **Deploy with confidence!**

---

**Ready for production? ✅ Let's go!** 🚀

For questions or issues, refer to `docs/MONGODB_SECURITY.md` or contact your MongoDB support.
