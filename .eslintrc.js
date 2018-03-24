module.exports = {
    "parser" : "babel-eslint",
    "env": {
        "es6": true,
		"node": false
    },
    "extends": "eslint:recommended",
    "parserOptions": {
		"sourceType": "module",
		"ecmaVersion": 8
    },
    "globals" : {
        "SSj": false,
        "Dispatch": false,
        "Sphere": false,
        "Shader": false,
        "Surface": false,
        "Transform": false,
        "Model": false,
        "Shape": false,
        "VertexList": false,
        "ShapeType": false,
        "Color": false,
        "Font": false,
        "Texture": false,
        "FileOp": false,
        "Key": false,
        "Keyboard": false,
        "FS": false
    },
    "rules": {
        "indent": ["error", 4],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "keyword-spacing" : [
            "error",
            {
                "before": true,
                "after": true
            }
        ],
        "key-spacing": [
            "error",
            {
                "beforeColon": true,
                "afterColon": true,
                "align" : "colon"
            }
        ],
        "no-extra-parens" : "error",
        "no-throw-literal" : "error",
        "no-return-await" : "error",
        "class-methods-use-this" : "warn",
        "no-var" : "error",
        "prefer-arrow-callback" : "warn",
        "prefer-const" : "warn",
        "no-trailing-spaces" : "error",
        "no-tabs" : "error",
        "no-unused-vars" : "warn"
    }
}