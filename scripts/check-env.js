#!/usr/bin/env node

// Script to check environment variables before deployment
const fs = require("fs")
const path = require("path")

const requiredProdVars = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_COMPANY_PHONE",
  "NEXT_PUBLIC_COMPANY_EMAIL",
  "NEXT_PUBLIC_WHATSAPP_NUMBER",
]

const recommendedProdVars = ["NEXT_PUBLIC_GA_MEASUREMENT_ID", "RESEND_API_KEY", "NEXT_PUBLIC_SENTRY_DSN"]

function checkEnvironmentVariables() {
  console.log("🔍 Checking environment variables...\n")

  const missing = []
  const recommended = []

  // Check required variables
  requiredProdVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName)
    } else {
      console.log(`✅ ${varName}`)
    }
  })

  // Check recommended variables
  recommendedProdVars.forEach((varName) => {
    if (!process.env[varName]) {
      recommended.push(varName)
    } else {
      console.log(`✅ ${varName}`)
    }
  })

  if (missing.length > 0) {
    console.log("\n❌ Missing required environment variables:")
    missing.forEach((varName) => console.log(`   - ${varName}`))
    console.log("\nPlease set these variables before deploying to production.")
    process.exit(1)
  }

  if (recommended.length > 0) {
    console.log("\n⚠️  Missing recommended environment variables:")
    recommended.forEach((varName) => console.log(`   - ${varName}`))
    console.log("\nThese are not required but recommended for production.")
  }

  console.log("\n✅ Environment check passed!")
}

if (require.main === module) {
  checkEnvironmentVariables()
}

module.exports = { checkEnvironmentVariables }
