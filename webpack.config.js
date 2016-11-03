module.exports = {
    entry: {demo: './src/js/index.js'},
    output: {
        path: __dirname,
        filename: 'out/bundle.js',
        publicPath: 'static',
    },
    module: {
        loaders: [
            {test: /\.js$/, loader: 'babel-loader', query:{ presets: ['es2015', 'react'] },
        exclude: /node_modules/},
			{test: /\.css$/, loader: 'style-loader!css-loader'},
			{test: /\.less$/, loader: 'style-loader!css-loader!less-loader'},
			{test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'}
        ]
    },
    
}

