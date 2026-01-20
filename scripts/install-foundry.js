const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BIN_DIR = path.join(process.cwd(), 'bin');

if (!fs.existsSync(BIN_DIR)) {
  fs.mkdirSync(BIN_DIR, { recursive: true });
}

console.log('Checking for Foundry binaries...');

const forgePath = path.join(BIN_DIR, 'forge');
const castPath = path.join(BIN_DIR, 'cast');

if (fs.existsSync(forgePath) && fs.existsSync(castPath)) {
  console.log('Foundry binaries already exist.');
} else {
  console.log('Downloading Foundry binaries...');
  // This is a simplified downloader. For production, you might want to fetch specific versions.
  // We rely on foundryup or direct download.
  try {
      // Download foundryup
      execSync('curl -L https://foundry.paradigm.xyz | bash');
      
      // Install (this updates ~/.foundry usually, so we need to copy)
      // We can assume the builder environment allows this.
      // If we are in Vercel, we can try to install to a custom location or just copy the binaries if we "foundryup" successfully.
      
      const homeDir = process.env.HOME || '/root';
      const foundryBin = path.join(homeDir, '.foundry/bin');
      
      // Run foundryup
      console.log('Running foundryup...');
      execSync(`${path.join(homeDir, '.foundry/bin/foundryup')}`, { stdio: 'inherit' });

      console.log('Copying binaries to ./bin...');
      fs.copyFileSync(path.join(foundryBin, 'forge'), forgePath);
      fs.copyFileSync(path.join(foundryBin, 'cast'), castPath);
      
      console.log('Foundry installed successfully to ./bin');
  } catch (e) {
      console.error('Failed to install Foundry:', e.message);
      process.exit(1);
  }
}
