#!/bin/bash

echo "🚀 Deployng EFÍMERO e-commerce - Password Reset Feature"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Sync frontend dist
echo -e "\n${BLUE}📦 Building frontend...${NC}"
npm run build

# Step 2: Upload backend files
echo -e "\n${BLUE}📤 Uploading backend files...${NC}"
scp -r backend/src/models/User.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/models/
scp -r backend/src/services/emailService.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/services/
scp -r backend/src/controllers/authController.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/controllers/
scp -r backend/src/routes/auth.js root@72.60.168.4:/root/vinateria-ecommerce/backend/src/routes/

# Step 3: Run migration on server
echo -e "\n${BLUE}🔄 Running database migration...${NC}"
ssh root@72.60.168.4 "cd /root/vinateria-ecommerce/backend && node migrate-add-reset-token.js"

# Step 4: Restart backend
echo -e "\n${BLUE}🔄 Restarting backend service...${NC}"
ssh root@72.60.168.4 "pm2 restart backend"

# Step 5: Deploy frontend
echo -e "\n${BLUE}📤 Uploading frontend dist...${NC}"
scp -r dist/* root@72.60.168.4:/var/www/efimero.com/html/

echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"
echo "Changes:"
echo "  • Password reset functionality added"
echo "  • New fields: resetToken, resetTokenExpiry"
echo "  • Email template: sendPasswordResetEmail"
echo "  • Frontend pages: ResetPassword.tsx"
echo "  • Routes: /forgot-password, /reset-password"
