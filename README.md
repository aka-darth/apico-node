# Apico

Node.js helper library for the [Apico](https://apico.net) API, to create powerful Voice and SMS applications.  
This helper implements wrappers for Apicoo REST API

More information on Apico APIs and related concepts, refer https://www.apico.net/docs/.

Installation
---------------
Installing using npm (node package manager):
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
npm install apico
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
If you don't have npm installed or don't want to use it:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
cd ~/.node_libraries # or the directory where node modules are stored in your OS.
git clone git://github.com/aka-darth/apico-node.git apico-node
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**NOTE:** If you are not using `npm` for installation, then make sure that the dependencies used are installed as well.

## Dependencies

Dev Dependencies (for running tests):
* [mocha](https://mochajs.org/)

## Usage

`apico` node.js helper can be used to make REST API calls.

Apico
--------
`Apico` is constructor of Api instance, which takes two arguments - `login` and `password`, like so:

```
var Apico=require('apico');
var api = new Apico(
	"<your Apico login>",
	"<your Apicopassword>"
);
```

The `api` object exposes all the Apico APIs and associated methods. Every method exposed by `api` object accepts two parameters:
* `params`: an object containing a map of API params and their values.
* `callback`: a callback that gets called after receiving response. Callbacks get two parameters:
  * `error`: Any occured error
  * `response`: a Javascript object because all our APIs send responses in JSON.

For example, to get [Redirect Settings](https://www.apico.net/docs/api/rest/get-redirect-settings) using our helper, you may do something like this:
```
api.get_number_callforwardings({
		number:'<your Apico number>'
	},function(err,callforwardings){
		if(err){
			console.error(err);
		}else{
			//now you got `callforwardings` array for this number
		}
	});
});
```

[Full documentation (jsdoc)](jsdoc/apico.html)

Tests
------
To run tests:
`npm test`

or
`mocha --reporter spec`

License
-------

References
----------
* [Apico API Documentation and Concepts](https://www.plivo.com/docs/)  
* [Examples](http://github.com/  ... ... )  

 