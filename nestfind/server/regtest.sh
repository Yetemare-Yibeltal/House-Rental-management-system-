#!/bin/bash
curl -i -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"Landlord","email":"landlord2@test.com","password":"Test1234","confirmPassword":"Test1234","role":"landlord","phone":"0911234567"}'
echo
