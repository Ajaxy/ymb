## Functions
<dl>
<dt><a href="#toModulesPlugin">toModulesPlugin()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Wraps CSS code into an <code>ym</code> module, that will use <code>system.provideCss</code> to register it in browser.</p>
</dd>
<dt><a href="#callWithContextPlugin">callWithContextPlugin(context)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Wraps code into JS function that is immediately called with some context.</p>
</dd>
<dt><a href="#closurePlugin">closurePlugin()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Wraps code in a simple JS closure.</p>
</dd>
<dt><a href="#extractFromContextPlugin">extractFromContextPlugin(property, exportTo)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Allows to extract the value of some property that is being set in the current context.</p>
</dd>
<dt><a href="#asyncPlugin">asyncPlugin(cfg)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Adds support for asynchronous loading of modules.
Requires files needed for current target, joins and wraps them into a function,
that will be called with needed params in a code added by <code>yms</code> server.</p>
</dd>
<dt><a href="#helpersPlugin">helpersPlugin()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Injects modules from <code>ym-helpers</code> package.</p>
</dd>
<dt><a href="#initPlugin">initPlugin()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Joins all &#39;init#&#39; parts into a single <code>init.js</code> file with the right order.</p>
</dd>
<dt><a href="#mapPlugin">mapPlugin(cfg)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Collects information about modules in the src path.
Check out child plugins for more info.</p>
</dd>
<dt><a href="#mapBuildPlugin">mapBuildPlugin(cfg)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Executes modules&#39; content and retrieves declaration params (module name, dependencies list, etc.).
Assigns aliases to modules and builds strings of dependencies&#39; aliases.
Creates file <code>map.json</code> with all that information.</p>
</dd>
<dt><a href="#mapFallbackPlugin">mapFallbackPlugin(cfg)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Adds &quot;modules map fallback&quot; for specified filter.
Map fallbacks allow asynchronous lazy loading information about modules (parts of map.js file)
by a module name filter.</p>
</dd>
<dt><a href="#mapInitialPlugin">mapInitialPlugin(cfg)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Extracts information about initial modules from file <code>map.json</code>
(that is previously created by <code>modules/map/build</code> plugin)
and injects it into stream as part of <code>init.js</code> contents.</p>
</dd>
<dt><a href="#minifyPlugin">minifyPlugin()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Runs <code>uglify()</code> on JS files.</p>
</dd>
<dt><a href="#namespacePlugin">namespacePlugin()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Adds project namespace into the global context.</p>
</dd>
<dt><a href="#plusPlugin">plusPlugin()</a> ⇒ <code>stream.Transform</code></dt>
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
<dt><a href="#setupPlugin">setupPlugin(cfg)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Injects main JS object <code>ym</code> with base project params as a part of <code>init.js</code>.</p>
</dd>
<dt><a href="#storePlugin">storePlugin(cfg)</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Stores built modules and info files into a specified folder in a disk.
Check out child plugins for more info.</p>
</dd>
<dt><a href="#storeAsyncPlugin">storeAsyncPlugin()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Creates directory structure and stores modules and info files in a build path.
Modules are renamed regarding to MD5 hash sum of their contents.
Generates and stores <code>hashes.json</code> info file that matches short aliases of modules with hash-based names.
Used for asynchronous modules loading.</p>
</dd>
<dt><a href="#storeSolidPlugin">storeSolidPlugin()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Creates a single file of all concatenated modules preceded by a <code>init.js</code> contents.
Used for synchronous single-file projects.</p>
</dd>
<dt><a href="#ymPlugin">ymPlugin()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>In case of standalone project injects <code>ym</code> modular system source code as part of <code>init.js</code> contents.
In case of plugin project only refers a property from a main project namespace.</p>
</dd>
<dt><a href="#compilePlugin">compilePlugin()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Pre-compiles HTML templates using <code>template.Parser</code> module from <code>ym-helpers</code> package.</p>
</dd>
<dt><a href="#toModulesPlugin">toModulesPlugin()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Wraps HTML code into an <code>ym</code> module.</p>
</dd>
<dt><a href="#eachInStream">eachInStream()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Helper for running handlers only for non empty buffers in the stream.</p>
</dd>
<dt><a href="#join">join()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Allows to join stream as an &quot;incoming branch&quot; for some other main stream.</p>
</dd>
<dt><a href="#pipeChainPlugin">pipeChainPlugin()</a> ⇒ <code>stream.Transform</code></dt>
<dd><p>Allows to create a chain of plugins where streams will be piped from one plugin to another.
Later this chain can be injected anywhere in a pipeline,
so pipeline contents will get inside the first plugin and the go out from the last one.</p>
</dd>
</dl>
<a name="toModulesPlugin"></a>
## toModulesPlugin() ⇒ <code>stream.Transform</code>
Wraps CSS code into an `ym` module, that will use `system.provideCss` to register it in browser.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
<a name="callWithContextPlugin"></a>
## callWithContextPlugin(context) ⇒ <code>stream.Transform</code>
Wraps code into JS function that is immediately called with some context.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>String</code> | Name of the JS variable to be used as context. |

<a name="closurePlugin"></a>
## closurePlugin() ⇒ <code>stream.Transform</code>
Wraps code in a simple JS closure.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
<a name="extractFromContextPlugin"></a>
## extractFromContextPlugin(property, exportTo) ⇒ <code>stream.Transform</code>
Allows to extract the value of some property that is being set in the current context.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  

| Param | Type | Description |
| --- | --- | --- |
| property | <code>String</code> | Property name. |
| exportTo | <code>String</code> | Name of the JS object that the property will be exported into. |

<a name="asyncPlugin"></a>
## asyncPlugin(cfg) ⇒ <code>stream.Transform</code>
Adds support for asynchronous loading of modules.
Requires files needed for current target, joins and wraps them into a function,
that will be called with needed params in a code added by `yms` server.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  

| Param | Type | Description |
| --- | --- | --- |
| cfg | <code>String</code> | Config. |

<a name="helpersPlugin"></a>
## helpersPlugin() ⇒ <code>stream.Transform</code>
Injects modules from `ym-helpers` package.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
**See**: https://www.npmjs.com/package/ym-helpers  
<a name="initPlugin"></a>
## initPlugin() ⇒ <code>stream.Transform</code>
Joins all 'init#' parts into a single `init.js` file with the right order.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
<a name="mapPlugin"></a>
## mapPlugin(cfg) ⇒ <code>stream.Transform</code>
Collects information about modules in the src path.
Check out child plugins for more info.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  

| Param | Type | Description |
| --- | --- | --- |
| cfg | <code>String</code> | Config. |

<a name="mapBuildPlugin"></a>
## mapBuildPlugin(cfg) ⇒ <code>stream.Transform</code>
Executes modules' content and retrieves declaration params (module name, dependencies list, etc.).
Assigns aliases to modules and builds strings of dependencies' aliases.
Creates file `map.json` with all that information.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  

| Param | Type | Description |
| --- | --- | --- |
| cfg | <code>String</code> | Config. |

<a name="mapFallbackPlugin"></a>
## mapFallbackPlugin(cfg) ⇒ <code>stream.Transform</code>
Adds "modules map fallback" for specified filter.
Map fallbacks allow asynchronous lazy loading information about modules (parts of map.js file)
by a module name filter.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  

| Param | Type | Description |
| --- | --- | --- |
| cfg | <code>String</code> | Config. |

<a name="mapInitialPlugin"></a>
## mapInitialPlugin(cfg) ⇒ <code>stream.Transform</code>
Extracts information about initial modules from file `map.json`
(that is previously created by `modules/map/build` plugin)
and injects it into stream as part of `init.js` contents.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  

| Param | Type | Description |
| --- | --- | --- |
| cfg | <code>String</code> | Config. |

<a name="minifyPlugin"></a>
## minifyPlugin() ⇒ <code>stream.Transform</code>
Runs `uglify()` on JS files.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
<a name="namespacePlugin"></a>
## namespacePlugin() ⇒ <code>stream.Transform</code>
Adds project namespace into the global context.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
<a name="plusPlugin"></a>
## plusPlugin() ⇒ <code>stream.Transform</code>
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
**Returns**: <code>stream.Transform</code> - Stream.  
**See**

- https://www.npmjs.com/package/vow
- https://www.npmjs.com/package/ym

<a name="setupPlugin"></a>
## setupPlugin(cfg) ⇒ <code>stream.Transform</code>
Injects main JS object `ym` with base project params as a part of `init.js`.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  

| Param | Type | Description |
| --- | --- | --- |
| cfg | <code>String</code> | Config. |

<a name="storePlugin"></a>
## storePlugin(cfg) ⇒ <code>stream.Transform</code>
Stores built modules and info files into a specified folder in a disk.
Check out child plugins for more info.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  

| Param | Type | Description |
| --- | --- | --- |
| cfg | <code>String</code> | Config. |

<a name="storeAsyncPlugin"></a>
## storeAsyncPlugin() ⇒ <code>stream.Transform</code>
Creates directory structure and stores modules and info files in a build path.
Modules are renamed regarding to MD5 hash sum of their contents.
Generates and stores `hashes.json` info file that matches short aliases of modules with hash-based names.
Used for asynchronous modules loading.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
<a name="storeSolidPlugin"></a>
## storeSolidPlugin() ⇒ <code>stream.Transform</code>
Creates a single file of all concatenated modules preceded by a `init.js` contents.
Used for synchronous single-file projects.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
<a name="ymPlugin"></a>
## ymPlugin() ⇒ <code>stream.Transform</code>
In case of standalone project injects `ym` modular system source code as part of `init.js` contents.
In case of plugin project only refers a property from a main project namespace.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
**See**: https://www.npmjs.com/package/ym  
<a name="compilePlugin"></a>
## compilePlugin() ⇒ <code>stream.Transform</code>
Pre-compiles HTML templates using `template.Parser` module from `ym-helpers` package.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
**See**: https://www.npmjs.com/package/ym-helpers  
<a name="toModulesPlugin"></a>
## toModulesPlugin() ⇒ <code>stream.Transform</code>
Wraps HTML code into an `ym` module.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
<a name="eachInStream"></a>
## eachInStream() ⇒ <code>stream.Transform</code>
Helper for running handlers only for non empty buffers in the stream.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
<a name="join"></a>
## join() ⇒ <code>stream.Transform</code>
Allows to join stream as an "incoming branch" for some other main stream.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
<a name="pipeChainPlugin"></a>
## pipeChainPlugin() ⇒ <code>stream.Transform</code>
Allows to create a chain of plugins where streams will be piped from one plugin to another.
Later this chain can be injected anywhere in a pipeline,
so pipeline contents will get inside the first plugin and the go out from the last one.

**Kind**: global function  
**Returns**: <code>stream.Transform</code> - Stream.  
