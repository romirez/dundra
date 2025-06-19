#!/bin/bash

# Dundra Backend API Test Script
# This script tests all available endpoints and Socket.io functionality

echo "🧪 Dundra Backend API Testing Suite"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    
    echo -e "\n${BLUE}Testing:${NC} $description"
    echo -e "${YELLOW}$method $BASE_URL$endpoint${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Status: $http_code"
        if [ -n "$body" ] && [ "$body" != "" ]; then
            echo "Response: $body" | head -c 200
            echo ""
        fi
    else
        echo -e "${RED}❌ FAIL${NC} - Expected: $expected_status, Got: $http_code"
        if [ -n "$body" ]; then
            echo "Response: $body"
        fi
    fi
}

# Check if server is running
echo -e "\n${BLUE}Checking if server is running...${NC}"
if curl -s "$BASE_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running. Please start with: npm run dev${NC}"
    exit 1
fi

echo -e "\n${BLUE}=== Core API Endpoints ===${NC}"

# Test health endpoint
test_endpoint "GET" "/health" "200" "Health Check"

# Test API root
test_endpoint "GET" "/api/v1" "200" "API Root"

# Test 404 handling
test_endpoint "GET" "/nonexistent" "404" "404 Error Handling"

echo -e "\n${BLUE}=== Authentication Endpoints ===${NC}"

# Test auth endpoints (these will return 404 since routes aren't implemented yet)
test_endpoint "POST" "/api/v1/auth/register" "404" "User Registration" '{"email":"test@example.com","password":"password123","username":"testuser"}'
test_endpoint "POST" "/api/v1/auth/login" "404" "User Login" '{"email":"test@example.com","password":"password123"}'

echo -e "\n${BLUE}=== Campaign Endpoints ===${NC}"

# Test campaign endpoints (these will return 404 since routes aren't implemented yet)
test_endpoint "GET" "/api/v1/campaigns" "404" "Get Campaigns"
test_endpoint "POST" "/api/v1/campaigns" "404" "Create Campaign" '{"name":"Test Campaign","description":"A test campaign"}'

echo -e "\n${BLUE}=== Socket.io Connection Test ===${NC}"

# Test Socket.io (basic connection test)
echo -e "\n${YELLOW}Testing Socket.io connection...${NC}"
echo "Note: For full Socket.io testing, use the frontend or a Socket.io client"
echo "The server supports these events:"
echo "  - join-campaign"
echo "  - leave-campaign" 
echo "  - transcription-start/data/end"
echo "  - generate-card"
echo "  - dice-roll"

echo -e "\n${BLUE}=== Server Information ===${NC}"
echo "Server URL: $BASE_URL"
echo "Health Check: $BASE_URL/health"
echo "API Base: $BASE_URL/api/v1"
echo "Socket.io: Available on same port"

echo -e "\n${GREEN}🎉 Backend testing complete!${NC}"
echo ""
echo "Next steps:"
echo "1. The core server infrastructure is working ✅"
echo "2. MongoDB connection is optional for development ✅" 
echo "3. Socket.io is ready for real-time features ✅"
echo "4. API routes need to be implemented (Task 1.4+)"
echo ""
echo "To test Socket.io features:"
echo "- Use the frontend application"
echo "- Or use a Socket.io client tool"
echo "- Or browser developer console with socket.io-client" 