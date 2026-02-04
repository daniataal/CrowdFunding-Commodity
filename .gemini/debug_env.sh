#!/bin/bash
# Debug script - run this on your server via SSH

echo "=== Checking .env file ==="
cd ~/commodity-crowdfunding
cat .env

echo ""
echo "=== Checking container environment ==="
sudo docker exec commodity-app env | grep -E "AUTH_SECRET|NEXTAUTH"

echo ""
echo "=== Container logs (last 20 lines) ==="
sudo docker logs commodity-app --tail 20
