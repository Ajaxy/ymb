## Functions
<dl>
<dt><a href="#css.toModules">css.toModules()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Wraps CSS code into an <code>ym</code> module, that will use <code>system.provideCss</code> to register it in browser.</p>
</dd>
<dt><a href="#js.closure">js.closure()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Wraps code in a simple JS closure.</p>
</dd>
<dt><a href="#modules.async">modules.async(cfg)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Adds support for asynchronous loading of modules.
Requires files needed for current target, joins and wraps them into a function,
that will be called with needed params in a code added by <code>yms</code> server.</p>
</dd>
<dt><a href="#modules.helpers">modules.helpers()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Injects modules from <code>ym-helpers</code> package.</p>
</dd>
<dt><a href="#modules.init">modules.init()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Joins all &#39;init#&#39; parts into a single <code>init.js</code> file with the right order.</p>
</dd>
<dt><a href="#modules.map">modules.map(cfg)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Collects information about modules in the src path.
Check out child plugins for more info.</p>
</dd>
<dt><a href="#modules.minify">modules.minify()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Runs <code>uglify()</code> on JS files.</p>
</dd>
<dt><a href="#modules.namespace">modules.namespace()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Adds project namespace into the global context.</p>
</dd>
<dt><a href="#modules.plus">modules.plus()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Injects <code>vow</code> and <code>Modules Plus</code> code.
<code>Modules Plus</code> is an additional layer to modular system <code>ym</code> that introduces:
— promises support
— dynamic dependencies and &quot;predictor&quot;
— modules <code>Definition</code> interface
— asynchronous storages
— providing of packages
— &quot;map fallbacks&quot; support
— synchronous <code>define</code> and <code>require</code>
— etc.</p>
</dd>
<dt><a href="#modules.setup">modules.setup(cfg)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Injects main JS object <code>ym</code> with base project params as a part of <code>init.js</code>.</p>
</dd>
<dt><a href="#modules.store">modules.store(cfg)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Stores built modules and info files into a specified folder in a disk.
Check out child plugins for more info.</p>
</dd>
<dt><a href="#modules.ym">modules.ym()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>In case of standalone project injects <code>ym</code> modular system source code as part of <code>init.js</code> contents.
In case of plugin project only refers a property from a main project namespace.</p>
</dd>
<dt><a href="#templates.compile">templates.compile()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Pre-compiles HTML templates using <code>template.Parser</code> module from <code>ym-helpers</code> package.</p>
</dd>
<dt><a href="#templates.toModules">templates.toModules()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Wraps HTML code into an <code>ym</code> module.</p>
</dd>
<dt><a href="#util.eachInStream">util.eachInStream()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Helper for running handlers only for non empty buffers in the stream.</p>
</dd>
<dt><a href="#util.join">util.join()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Allows to join stream as an &quot;incoming branch&quot; for some other main stream.</p>
</dd>
<dt><a href="#util.pipeChain">util.pipeChain()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Allows to create a chain of plugins where streams will be piped from one plugin to another.
Later this chain can be injected anywhere in a pipeline,
so pipeline contents will get inside the first plugin and the go out from the last one.</p>
</dd>
</dl>
<a name="css.toModules"></a>
## css.toModules() ⇒ <code>stream.Transform</code>
Wraps CSS code into an `ym` module, that will use `system.provideCss` to register it in browser.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
<a name="js.closure"></a>
## js.closure() ⇒ <code>stream.Transform</code>
Wraps code in a simple JS closure.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
<a name="modules.async"></a>
## modules.async(cfg) ⇒ <code>stream.Transform</code>
Adds support for asynchronous loading of modules.
Requires files needed for current target, joins and wraps them into a function,
that will be called with needed params in a code added by `yms` server.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  

| Param | Type | Description |
| --- | --- | --- |
| cfg | <code>String</code> | Config |

<a name="modules.helpers"></a>
## modules.helpers() ⇒ <code>stream.Transform</code>
Injects modules from `ym-helpers` package.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
**See**: https://www.npmjs.com/package/ym-helpers  
<a name="modules.init"></a>
## modules.init() ⇒ <code>stream.Transform</code>
Joins all 'init#' parts into a single `init.js` file with the right order.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
<a name="modules.map"></a>
## modules.map(cfg) ⇒ <code>stream.Transform</code>
Collects information about modules in the src path.
Check out child plugins for more info.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  

| Param | Type | Description |
| --- | --- | --- |
| cfg | <code>String</code> | Config |

<a name="modules.minify"></a>
## modules.minify() ⇒ <code>stream.Transform</code>
Runs `uglify()` on JS files.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
<a name="modules.namespace"></a>
## modules.namespace() ⇒ <code>stream.Transform</code>
Adds project namespace into the global context.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
<a name="modules.plus"></a>
## modules.plus() ⇒ <code>stream.Transform</code>
Injects `vow` and `Modules Plus` code.
`Modules Plus` is an additional layer to modular system `ym` that introduces:
— promises support
— dynamic dependencies and "predictor"
— modules `Definition` interface
— asynchronous storages
— providing of packages
— "map fallbacks" support
— synchronous `define` and `require`
— etc.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
**See**

- https://www.npmjs.com/package/vow
- https://www.npmjs.com/package/ym

<a name="modules.setup"></a>
## modules.setup(cfg) ⇒ <code>stream.Transform</code>
Injects main JS object `ym` with base project params as a part of `init.js`.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  

| Param | Type | Description |
| --- | --- | --- |
| cfg | <code>String</code> | Config |

<a name="modules.store"></a>
## modules.store(cfg) ⇒ <code>stream.Transform</code>
Stores built modules and info files into a specified folder in a disk.
Check out child plugins for more info.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  

| Param | Type | Description |
| --- | --- | --- |
| cfg | <code>String</code> | Config |

<a name="modules.ym"></a>
## modules.ym() ⇒ <code>stream.Transform</code>
In case of standalone project injects `ym` modular system source code as part of `init.js` contents.
In case of plugin project only refers a property from a main project namespace.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
**See**: https://www.npmjs.com/package/ym  
<a name="templates.compile"></a>
## templates.compile() ⇒ <code>stream.Transform</code>
Pre-compiles HTML templates using `template.Parser` module from `ym-helpers` package.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
**See**: https://www.npmjs.com/package/ym-helpers  
<a name="templates.toModules"></a>
## templates.toModules() ⇒ <code>stream.Transform</code>
Wraps HTML code into an `ym` module.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
<a name="util.eachInStream"></a>
## util.eachInStream() ⇒ <code>stream.Transform</code>
Helper for running handlers only for non empty buffers in the stream.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
<a name="util.join"></a>
## util.join() ⇒ <code>stream.Transform</code>
Allows to join stream as an "incoming branch" for some other main stream.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
<a name="util.pipeChain"></a>
## util.pipeChain() ⇒ <code>stream.Transform</code>
Allows to create a chain of plugins where streams will be piped from one plugin to another.
Later this chain can be injected anywhere in a pipeline,
so pipeline contents will get inside the first plugin and the go out from the last one.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream  
