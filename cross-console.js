;(function(window, undefined) {
	"use strict";

	var CC = {},
	// this is typically window
	root = this || window;
	if (typeof module !== 'undefined' && module.exports) {
        module.exports = CC;
    } else {
        root.cconsole = CC;
    }

	// create the global CConsole
	CC.settings = {
		debug: true,
		environment : "development", // production
		logs: [],
		send: function(error, identifier) { return; } // un-implemented, meant to be replaced by other code.
	};

	var aps = Array.prototype.slice,
	con = root.console,
	methods = [
		'error',
		'warn',
		'info',
		'debug',
		'log'
	],
	pass_methods = [
		'assert',
		'clear',
		'count',
		'dir',
		'dirxml',
		'exception',
		'group',
		'groupCollapsed',
		'groupEnd',
		'profile',
		'profileEnd',
		'table',
		'time',
		'timeEnd',
		'trace',
	],
	idx = pass_methods.length,

	loadMethods = function(method){
		CC[method]=function() {
			if(CC.settings.debug && con && con[method]){
				var args = arguments;
				con.firebug ? con[method].apply(window, args) :
				con[method] ? con[method](args) :
				con.log(args);
			}
		};
	},

	loadTraceMethods = function(idx,method){
		CC[method] = function() {
			if(method !== 'error' && CC.settings.environment === "production" ) { 
				return; 
			}
			try {
				var args = aps.call(arguments),
					log_arr,
					error = new Error(),
					stackError = error && error.stack, 
					trace, line_trace,identifier="", re = /\//g; 
				
				// Sometimes when we try to get the stack trace, 
				// things go poorly. We still want to continue on 
				// our merry way however. We've noticed this 
				// behavior particularly when highcharts is involved
				if (stackError && typeof stackError === 'string') {
					try {
						trace = stackError.split(/\r\n|\r|\n/)[3].split(/\//);
					}catch (ignore){
						trace = ['Failed to retrieve stack trace.'];
					}
				}

				line_trace = trace[trace.length-1].split(/:/);

				if(method!=='debug') {
					args.push(line_trace[0] + " Line "+line_trace[1]);
					identifier = line_trace[0].replace(re,"~")+":"+line_trace[1];
				} else {
					args.push(((new Error() && new Error().stack)?new Error().stack:'').split(/\r\n|\r|\n/));
				}

				// errors and warning (but the if above only allows errors in prod) should always go to the console in dev.
				if ( !con || (!CC.settings.debug && ['error','warn'].indexOf(method) < 0) ) { 
					return; 
				}

				log_arr = [method].concat( args );
				log_arr.push(new Date().getTime());
				CC.settings.logs.push( log_arr );

				// the method must be an error becaue of previous if statement
				if(CC.settings.environment === 'production') { 
					CC.settings.send( log_arr,  identifier);
					return;
				}
				// push to the actual console 

				con.firebug ? con[method].apply(root, args) :
					con[method] ? con[method](args) :
					con.log(args);

			} catch(ignore){}
		};
	};

	// create a console if it doesn't exist, overrite the old one too
	root.console = CC; 

	/* passthrough any console methods */
	while(--idx >= 0){
		loadMethods(pass_methods[idx]);
	}

	// reuse the vars
	idx = methods.length;

	while(--idx >= 0){
		loadTraceMethods(idx,methods[idx]);
	}

})(window);