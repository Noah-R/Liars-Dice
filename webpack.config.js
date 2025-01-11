const path = require("path");
module.exports = {
    mode: 'production',
	entry: "./client.js",
	output: {
		filename: "./index.js",
	},
	module: {
		rules: [
			{
				test: /.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env", "@babel/preset-react"],
					},
				},
			},
		],
	},
};
