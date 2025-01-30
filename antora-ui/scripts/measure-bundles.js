'use strict'

const browserify = require('browserify')
const fs = require('fs')
const path = require('path')
const uglify = require('uglify-js')
const zlib = require('zlib')

// Bundles to measure
const bundles = [
  {
    name: 'core-custom',
    file: '../src/js/vendor/highlight.bundle.js',
    expectedLanguages: ['cpp', 'bash', 'javascript', 'json'], // Languages we expect
  },
  {
    name: 'core-only',
    file: '../src/js/vendor/highlight.core.js',
    expectedLanguages: [], // Should have no languages
  },
  {
    name: 'common',
    file: '../src/js/vendor/highlight.common.js',
    expectedLanguages: ['cpp', 'javascript', 'python'], // Common languages
  },
  {
    name: 'full',
    file: '../src/js/vendor/highlight.full.js',
    expectedLanguages: ['cpp', 'javascript', 'python'], // Should have all languages
  },
]

async function measureBundle (bundle) {
  return new Promise((resolve, reject) => {
    // First verify the source file exists
    const filePath = path.join(__dirname, bundle.file)
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`Source file not found: ${bundle.file}`))
    }

    console.log(`\nProcessing ${bundle.name}...`)
    console.log(`Source file: ${filePath}`)

    const b = browserify(filePath)
    b.bundle((err, buf) => {
      if (err) return reject(err)

      const raw = buf.toString()
      console.log(`- Bundle created: ${raw.length} bytes`)

      // Verify bundle contains expected languages
      bundle.expectedLanguages.forEach((lang) => {
        if (!raw.includes(`language/${lang}`)) {
          console.warn(`Warning: Expected language '${lang}' not found in bundle`)
        }
      })

      const minified = uglify.minify(raw).code
      console.log(`- Minified size: ${minified.length} bytes`)

      // Add gzip size
      const gzipped = zlib.gzipSync(minified)
      console.log(`- Gzipped size: ${gzipped.length} bytes`)

      resolve({
        name: bundle.name,
        rawSize: raw.length,
        minSize: minified.length,
        gzipSize: gzipped.length,
        containsHljs: raw.includes('highlight.js'),
        containsHighlightAll: raw.includes('highlightAll'),
      })
    })
  })
}

async function measureAll () {
  console.log('Measuring highlight.js bundle sizes...')
  console.log('=====================================')

  const results = []

  for (const bundle of bundles) {
    try {
      const result = await measureBundle(bundle)
      results.push(result)

      console.log(`\n${result.name} Summary:`)
      console.log(`  Raw: ${(result.rawSize / 1024).toFixed(1)}KB`)
      console.log(`  Minified: ${(result.minSize / 1024).toFixed(1)}KB`)
      console.log(`  Gzipped: ${(result.gzipSize / 1024).toFixed(1)}KB`)
      console.log(`  Contains highlight.js: ${result.containsHljs}`)
      console.log(`  Contains highlightAll: ${result.containsHighlightAll}`)
    } catch (err) {
      console.error(`\nError measuring ${bundle.name}:`, err)
    }
  }

  // Print comparison table
  console.log('\nSize Comparison:')
  console.log('===============')
  console.table(results.map((r) => ({
    name: r.name,
    'Raw (KB)': (r.rawSize / 1024).toFixed(1),
    'Min (KB)': (r.minSize / 1024).toFixed(1),
    'Gzip (KB)': (r.gzipSize / 1024).toFixed(1),
  })))
}

measureAll()
