#!/bin/bash

echo "Starting all backend services..."

# Start each service in background
cd apps/auth-service && npm run start:dev &
sleep 3

cd apps/tasks-service && npm run start:dev &
sleep 3

cd apps/notifications-service && npm run start:dev &
sleep 3

cd apps/api-gateway && npm run start:dev &

cd apps/web && npm run dev &

echo "All services started in background!"
echo "Use 'ps aux | grep node' to see running processes"
wait
