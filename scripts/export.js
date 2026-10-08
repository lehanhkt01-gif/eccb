const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '..', 'src', 'app', 'api');
const backupPath = path.join(__dirname, '..', 'src', 'app_api_backup');

console.log('--- Chuẩn bị xuất bản Static Export cho GitHub Pages ---');
let apiMoved = false;

try {
  if (fs.existsSync(apiPath)) {
    fs.renameSync(apiPath, backupPath);
    apiMoved = true;
    console.log('✓ Đã tạm thời tách API routes để xuất bản static HTML');
  }

  console.log('✓ Bắt đầu npx next build (Webpack static exporter)...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      GITHUB_PAGES: 'true',
      NEXT_PUBLIC_BASE_PATH: '/eccb',
    },
  });

  const outDir = path.join(__dirname, '..', 'out');
  if (fs.existsSync(outDir)) {
    fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
    console.log('✓ Đã tạo file .nojekyll để vô hiệu hóa Jekyll trên GitHub Pages');
  }

  console.log('✓ Xuất bản tĩnh thành công vào thư mục out/!');
} catch (error) {
  console.error('Lỗi trong quá trình build static export:', error);
  process.exit(1);
} finally {
  if (apiMoved && fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, apiPath);
    console.log('✓ Đã khôi phục lại thư mục API routes');
  }
}
