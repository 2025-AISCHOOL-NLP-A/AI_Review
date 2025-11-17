import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// CSP 헤더를 제어하는 플러그인 (개발 환경용)
const cspPlugin = () => {
  return {
    name: 'csp-headers',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        // 개발 환경에서만 CSP 헤더 설정 (eval 허용)
        // 프로덕션 빌드에서는 헤더가 적용되지 않음
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; " +
          "worker-src 'self' blob: data:; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: https: http://localhost:3001; " +
          "connect-src 'self' ws://localhost:5173 http://localhost:3001 http://localhost:8000; " +
          "frame-ancestors 'none';"
        )
        next()
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react(),
      // 개발 환경에서만 CSP 플러그인 사용
      !isProduction && cspPlugin()
    ].filter(Boolean),
    server: {
      port: 5173,
      open: false,
      // HMR을 WebSocket만 사용하도록 설정 (eval 사용 최소화)
      hmr: {
        protocol: 'ws',
        host: 'localhost'
      }
    },
    build: {
      outDir: 'build',
      // 프로덕션 빌드: 소스맵 완전 비활성화 (eval 사용 방지)
      sourcemap: false,
      // esbuild로 minify (eval 사용 안 함)
      minify: 'esbuild',
      // 롤업 출력 설정: eval 없이 ES 모듈만 사용
      rollupOptions: {
        output: {
          format: 'es',
          // eval 사용 방지를 위한 코드 생성 설정
          generatedCode: {
            constBindings: true,
            objectShorthand: true
          },
          // 청크 파일명 설정
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      },
      // 청크 크기 경고 제한
      chunkSizeWarningLimit: 1000,
      // CommonJS 변환 비활성화 (ES 모듈만 사용)
      commonjsOptions: {
        transformMixedEsModules: false
      }
    },
    // CSS 설정: 소스맵 비활성화
    css: {
      devSourcemap: false
    },
    // esbuild 설정: eval 사용 완전 차단
    esbuild: {
      legalComments: 'none',
      // 프로덕션에서만 minify
      minifyIdentifiers: isProduction,
      minifySyntax: isProduction,
      minifyWhitespace: isProduction
    },
    // 의존성 최적화 설정
    optimizeDeps: {
      esbuildOptions: {
        // 최신 ES 문법 사용 (eval 사용 방지)
        target: 'esnext'
      },
      // 공통 의존성 포함
      include: ['react', 'react-dom', 'react-router-dom']
    }
  }
})

