## Webpack 优化

### 1. 提高打包速度

#### 1.1 优化 loader 搜索范围

- `exclude`: 不处理 node_modules 下面的文件
- `include`: 只处理 src 目录下的文件
- `cacheDirectory`: 开启 `babel` 缓存

```js
module: {
  rules: [
    {
      test: /\.(ts|js)x?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            include: path.resolve(__dirname, "../src"),
          },
        },
      ],
    },
  ];
}
```

#### 1.2 使用多线程打包

`thread-loader`， 该放置在其它 loader 之前，放置在这个 loader 之后的 loader 就会在一个单独的 worker 池(worker pool)中运行。

```js
module: {
  rules: [
    {
      test: /\.(ts|js)x?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "thread-loader",
          options: {
            // 产生的 worker 的数量，默认是 cpu 的核心数
            workers: 2,

            // 一个 worker 进程中并行执行工作的数量
            // 默认为 20
            workerParallelJobs: 50,

            // 额外的 node.js 参数
            workerNodeArgs: ["--max-old-space-size", "1024"],

            // 闲置时定时删除 worker 进程
            // 默认为 500ms
            // 可以设置为无穷大， 这样在监视模式(--watch)下可以保持 worker 持续存在
            poolTimeout: 2000,

            // 池(pool)分配给 worker 的工作数量
            // 默认为 200
            // 降低这个数值会降低总体的效率，但是会提升工作分布更均一
            poolParallelJobs: 50,

            // 池(pool)的名称
            // 可以修改名称来创建其余选项都一样的池(pool)
            name: "my-pool",
          },
        },
        {
          loader: "babel-loader",
        },
      ],
    },
  ];
}
```

同样，thread-loader 也不是越多越好，也请只在耗时的 loader 上使用。

#### 1.3 使用动态链接库文件

`DllPlugin` 能把第三方库代码分离开，并且每次文件更改的时候，它只会打包该项目自身的代码。所以打包速度会更快

```js
module.exports = {
  mode: "production",
  entry: {
    // 第三方库
    vendor: ["react", "react-dom", "react-router-dom"],
  },
  output: {
    path: path.resolve(__dirname, "../dll"),
    filename: "[name].dll.js",
    /*
     存放相关的dll文件的全局变量名称，防止全局变量冲突。
    */
    library: "[name]_library",
  },

  plugins: [
    // 使用插件 DllPlugin
    new webpack.DllPlugin({
      // manifest文件中请求的上下文，默认为该webpack文件上下文。
      context: path.resolve(__dirname, ".."),
      /**
       * path
       * 定义 manifest 文件生成的位置
       * [name]的部分由entry的名字替换
       */
      path: path.join(__dirname, "../dll", "[name]-manifest.json"),
      /**
       * name
       * static bundle 输出到那个全局变量上
       * 和 output.library 一样即可。
       */
      name: "[name]_library",
    }),
  ],
};
```

`DllReferencePlugin` 这个插件是在 webpack.config.js 中使用的，该插件的作用是把刚刚在 webpack.dll.js 中打包生成的 dll 文件引用到需要的预编译的依赖上来。就是说在 webpack.dll.js 中打包后比如会生成 vendor.dll.js 文件和 vendor-manifest.json 文件，vendor.dll.js 文件包含所有的第三方库文件，vendor-manifest.json 文件会包含所有库代码的一个索引，当在使用 webpack.config.js 文件打包 DllReferencePlugin 插件的时候，会使用该 DllReferencePlugin 插件读取 vendor-manifest.json 文件，看看是否有该第三方库。vendor-manifest.json 文件就是有一个第三方库的一个映射而已。

所以说 第一次使用 webpack.dll.js 文件会对第三方库打包，打包完成后就不会再打包它了，然后每次运行 webpack.config.js 文件的时候，都会打包项目中本身的文件代码，当需要使用第三方依赖的时候，会使用 DllReferencePlugin 插件去读取第三方依赖库。所以说它的打包速度会得到一个很大的提升。

```js
module.exports = {
  plugins: [
    // 使用 DllReferencePlugin 插件
    new webpack.DllReferencePlugin({
      // 打包时读取 mainfest.json 文件，判断第三方包是否在dll文件中，有则不打包。
      manifest: require("../dll/vendor-manifest.json"),
      context: path.resolve(__dirname, ".."),
    }),
  ],
};
```

#### 1.4 IgnorePlugin

`IgnorePlugin` 打包时忽略第三方指定目录

```js
module.exports = {
  plugins: [new webpack.IgnorePlugin(/\.\/locale/, /moment/)],
};
```

#### 1.5 resolve 配置

- `modules`: 配置 Webpack 去哪些目录下寻找第三方模块
- `extensions`: 自动补全文件后缀, `import` 文件时无需编写后缀
- `mainFields`: 用于配置第三方模块使用那个入口文件, 通过情况 package.json 都不会声明 browser 或 module 字段，所以使用 main 加快查找
- `noParse`: 可以让 Webpack 忽略对部分没采用模块化的文件,如 jquery
- `symlinks`: 是否将符号链接(symlink)解析到它们的符号链接位置(symlink location)。启用时，符号链接(symlink)的资源，将解析为其 真实 路径，而不是其符号链接(symlink)的位置。注意，当使用创建符号链接包的工具（如 npm link）时，这种方式可能会导致模块解析失败。

```js
module.exports = {
  resolve: {
    // modules: [path.resolve(__dirname, "../node_modules")],
    extensions: [".ts", ".tsx", ".js", ".jsx", ".sass"],
    mainFields: ["main"],
    // noParse: /jquery/,
    symlinks: false,
  },
};
```

### 2.减少打包体积

### 2.1 开启 Tree Shaking

设置 `mode` 为 `production` 时， webpack 会删除无用的代码

```js
module.exports = {
  mode: "production",
};
```

#### 2.2 配置 externals，使用 CDN

一般来说，常用的第三方库都会发布在 CDN 上，我们可以使用 cdn 的方式加载资源，这样就不用对资源进行打包，减少打包后的体积。使用 `externals` 配置可以忽略第三方库的打包

```js
module.exports = {
  externals: {
    react: "React",
    "react-dom": "ReactDOM",
    "react-redux": "ReactRedux",
    redux: "Redux",
    axios: "axios",
    history: "History",
  },
};
```

<!-- #### 2.3  动态导入和按需加载 
使用 '@loadable/component' 动态加载

``` js
import loadable from '@loadable/component'

// 组件按需加载(Code Spliting)
const Layout = loadable(() => import('./components/layout'));
``` -->

#### 2.3 terser-webpack-plugin 压缩代码
``` js
module.exports = {
   optimization: {
    minimize: true,
    minimizer: [
      new TerserWebpackPlugin({
        exclude: /node_modules/,
        parallel: true, // 开启多进程
        extractComments: true,
      }),
    ]
  },
};
```

