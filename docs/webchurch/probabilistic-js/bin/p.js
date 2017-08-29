var fs = require("fs")
var path = require("path")
var transform = require("probabilistic/transform")
var browserify = require("browserify")

if (require.main === module)
{
	var usage = "usage: node p.js [-p] srcfile"

	var numargs = process.argv.length
	if (numargs < 3 || numargs > 4 || (numargs == 4 && process.argv[2] != "-p"))
	{
		console.log(usage)
		process.exit(1)
	}

	var srcfile
	if (numargs == 3)
		srcfile = process.argv[2]
	else
		srcfile = process.argv[3]
	srcfile = fs.realpathSync(srcfile)
	var keepCompiledCode = (numargs === 4)

	// Flatten module dependency graph using browserify
	// ISSUE: browserify replaces certain core node modules (such as 'process') with
	//   browser-compatible shims that may not have the full functionality of the
	//   original module or may depend on browser concepts (e.g. window) existing.
	//   This is not ideal for running probabilistic-js on the command line through
	//   node, but I'm willing to tolerate it for now b/c browser execution will
	//   be the more common use-case.
	// FIX: browserify uses a module 'browser-builtins' to get these shims. It would
	//   be a simple matter of replacing the 'browserBuiltins' var with '{}' to fix
	//   this issue; however, modifying browserify comes with its own baggage. I'm
	//   going to try and convince substack to make a change to the code that will
	//   allow us to toggle browser-builtins on/off.
	var b = browserify(srcfile)
	function browserifyDone(err, src)
	{
		// Run probTransform for callsite naming
		src = transform.probTransform(src)

		// Write this "compiled" code to a .js file
		var compiledfile = path.join(path.dirname(srcfile), path.basename(srcfile).replace(path.extname(srcfile), ".js"))
		fs.writeFileSync(compiledfile, src)

		// 'require' the compiled code file to run it
		try
		{
			require(compiledfile)
		}
		finally
		{
			// If the user gave us the -p option, keep the compiled code around.
			// Otehrwise, delete it.
			if (!keepCompiledCode)
				fs.unlinkSync(compiledfile)
		}
	}
	var bundlestream = b.bundle({},browserifyDone)
}


// TODO: node package file that specifies all the dependencies.