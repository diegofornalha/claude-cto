self.__BUILD_MANIFEST = {
  "polyfillFiles": [
    "static/chunks/polyfills.js"
  ],
  "devFiles": [
    "static/chunks/react-refresh.js"
  ],
  "ampDevFiles": [],
  "lowPriorityFiles": [],
  "rootMainFiles": [],
  "pages": {
    "/": [
      "static/chunks/webpack.js",
      "static/chunks/vendors.js",
      "static/chunks/main.js",
      "static/chunks/pages/index.js"
    ],
    "/_app": [
      "static/chunks/webpack.js",
      "static/chunks/vendors.js",
      "static/chunks/main.js",
      "static/chunks/pages/_app.js"
    ],
    "/_error": [
      "static/chunks/webpack.js",
      "static/chunks/vendors.js",
      "static/chunks/main.js",
      "static/chunks/pages/_error.js"
    ],
    "/admin": [
      "static/chunks/webpack.js",
      "static/chunks/vendors.js",
      "static/chunks/main.js",
      "static/chunks/pages/admin.js"
    ],
    "/admin/health": [
      "static/chunks/webpack.js",
      "static/chunks/vendors.js",
      "static/chunks/main.js",
      "static/chunks/pages/admin/health.js"
    ],
    "/orchestration": [
      "static/chunks/webpack.js",
      "static/chunks/vendors.js",
      "static/chunks/main.js",
      "static/chunks/pages/orchestration.js"
    ],
    "/sitemap": [
      "static/chunks/webpack.js",
      "static/chunks/vendors.js",
      "static/chunks/main.js",
      "static/chunks/pages/sitemap.js"
    ],
    "/tasks": [
      "static/chunks/webpack.js",
      "static/chunks/vendors.js",
      "static/chunks/main.js",
      "static/chunks/pages/tasks.js"
    ]
  },
  "ampFirstPages": []
};
self.__BUILD_MANIFEST.lowPriorityFiles = [
"/static/" + process.env.__NEXT_BUILD_ID + "/_buildManifest.js",
,"/static/" + process.env.__NEXT_BUILD_ID + "/_ssgManifest.js",

];