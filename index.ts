const version = require('./package.json').version

console.log("----------------------------------\nGrolf Server\n----------------------------------\n")
console.log("🏗️  Starting ABOT...");
console.log("📦 Loading Slack App...")
console.log("🔑 Loading environment variables...")

// do loading stuff here

console.log("🚀 Server Started in", Bun.nanoseconds() / 1000000, "milliseconds on version:", version + "!", "\n\n----------------------------------\n")

// run main app here