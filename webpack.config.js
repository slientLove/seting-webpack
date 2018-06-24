const path = require('path');
const uglify = require('uglifyjs-webpack-plugin');
const htmlPlugin = require('html-webpack-plugin');
const extractText = require('extract-text-webpack-plugin');
const glob = require("glob");     // 需要同步检查html模板，需要引入glob对象
const purifyCssplugin = require("purifycss-webpack");
const entryPath = require("./webpack_config/path_config");
const webpack = require("webpack");     // 引入webpack模块
const copyPlugin = require("copy-webpack-plugin");    // 用于上传不要的静态文件到指定文件夹
  if(process.env.type=="build"){          // 根据生产条件判断上线用哪一种类型
      var  website = {
          publicPath: "http://192.168.1.110:8080/"
      }
  }else{
      var website = {
          publicPath: "localhost:8080/"         // npm run dev就会运行生产环境
      }
  }

module.exports = {
    entry: {
        entry: `${entryPath.entry}`,
        jquery: "jquery"
    },
    output:{
        path: path.resolve(__dirname,'dist'),
        filename: '[name].js',
        publicPath: website.publicPath        // 配置静态资源路径,这样css文件路径就是对的
    },
    module: {
           rules: [
               {
                   test:/\.css$/,
                   use: extractText.extract({      // 单独分离出css文件需要这样修改use
                       fallback: "style-loader",
                       use: [
                           {
                               loader: "css-loader",   // 对提取css进行改造
                               options: {
                                   importLoaders: 1
                               }
                           },{
                             loader: "postcss-loader"   // 在后面继续加上loader就可以
                           }
                       ]
                   })
               },{
                   test: /\.(jpg|jpeg|png|gif)$/,
                   use:[
                       {
                           loader: "url-loader",     // 解析图片路径
                           options: {
                               limit: 5000,
                               outputPath: "images/"
                           }
                       }
                   ]
               },{
                  test: /\.(html|htm)$/i,
                  use: [
                      {
                          loader: "html-withimg-loader",       // 解析html里面的img标签
                          options: {
                              outputPath: "images/"
                          }
                      }
                  ]
               },{
                  test: /\.scss$/,          // 加载sass之前，要先加载对应的css的loader
                   use: extractText.extract({
                       use: [
                           {
                               loader: "css-loader"        // 将sass分离出来
                           },{
                               loader: "sass-loader"
                           }
                       ],
                       fallback: "style-loader"
                   })
               },{
                   test: /\.(js|jsx)$/,
                   use: [
                       {
                           loader: "babel-loader"
                       }
                   ],
                   exclude: /node_modules/      // 可以忽略的包，不必要进行打包
               }
           ]
    },
    plugins: [
        // new uglify(),      // 配置js进行压缩,在开发环境下不必要压缩
        new htmlPlugin({
           minify:{
               removeAttributeQuotes:true     // 配置对html进行压缩，去掉双引号
           },
            hash:true,
            template: './index.html'
        }),
        new extractText('css/index.css') ,    // 分离后css存储的位置
        new purifyCssplugin({                 // 去除没有使用的css
            paths: glob.sync(path.join(__dirname,"./*.html"))   // 根据html文件遍历所有没有用到的css
        }),
        new webpack.ProvidePlugin({       //  由webpack提供的插件，优雅的打包第三方类库
            $: "jquery"
        }),
        new webpack.BannerPlugin("这是入口js文件，创立于11/06"),    //  添加打包时的说明
        new webpack.optimize.CommonsChunkPlugin({
            name: ["jquery"],
            filename: "asserts/js/[name].js",      //抽离第三方库,优化webpack
            minChunks:2
        }),
        new copyPlugin(       // 配置项必须是一个数组
            [
              {
                from: __dirname+"/src/public",     // 文件来源
                to:"./public"                  // 文件存放路径
            }
        ]),
        new webpack.HotModuleReplacementPlugin()   // 进行热更新
    ],
    devServer: {
        contentBase: path.resolve(__dirname,'dist'),
        host: "192.168.1.110",
        port: '8080',
        compress: true           // 支持服务器压缩
    },
    watchOptions: {             // 服务热打包，会进行监测，修改后会自动进行打包
        poll: 1000,              // 监测时间是1s
        aggregateTimeout: 2000,       // 重复按键2s内只会打包一次
        ignored: /node_modules/
    }
}