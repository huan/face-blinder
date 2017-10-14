# FaceBlinder v0.0.12 Documentation

## Classes

<dl>
<dt><a href="#FaceBlinder">FaceBlinder</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#FaceBlinderOptions">FaceBlinderOptions</a></dt>
<dd><p>Point Type</p>
</dd>
</dl>

<a name="FaceBlinder"></a>

## FaceBlinder
**Kind**: global class  

* [FaceBlinder](#FaceBlinder)
    * [new FaceBlinder([options])](#new_FaceBlinder_new)
    * [.init()](#FaceBlinder+init) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.quit()](#FaceBlinder+quit) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.destroy()](#FaceBlinder+destroy) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.see(file)](#FaceBlinder+see) ⇒ <code>Promise.&lt;Array.&lt;Face&gt;&gt;</code>
    * [.similar(face, [threshold])](#FaceBlinder+similar) ⇒ <code>Promise.&lt;Array.&lt;Face&gt;&gt;</code>
    * [.recognize(face)](#FaceBlinder+recognize) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
    * [.remember(face, [name])](#FaceBlinder+remember) ⇒ <code>Promise.&lt;(void\|string\|null)&gt;</code>
    * [.forget(face)](#FaceBlinder+forget) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.file(face)](#FaceBlinder+file) ⇒ <code>string</code>
    * [.face(md5)](#FaceBlinder+face) ⇒ <code>Promise.&lt;(Face\|null)&gt;</code>
    * [.list(md5Partial)](#FaceBlinder+list) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>

<a name="new_FaceBlinder_new"></a>

### new FaceBlinder([options])
Creates an instance of FaceBlinder.


| Param | Type |
| --- | --- |
| [options] | [<code>FaceBlinderOptions</code>](#FaceBlinderOptions) | 

<a name="FaceBlinder+init"></a>

### faceBlinder.init() ⇒ <code>Promise.&lt;void&gt;</code>
Init the FaceBlinder

**Kind**: instance method of [<code>FaceBlinder</code>](#FaceBlinder)  
<a name="FaceBlinder+quit"></a>

### faceBlinder.quit() ⇒ <code>Promise.&lt;void&gt;</code>
Quit FaceBlinder

**Kind**: instance method of [<code>FaceBlinder</code>](#FaceBlinder)  
<a name="FaceBlinder+destroy"></a>

### faceBlinder.destroy() ⇒ <code>Promise.&lt;void&gt;</code>
Destroy FaceBlinder

**Kind**: instance method of [<code>FaceBlinder</code>](#FaceBlinder)  
<a name="FaceBlinder+see"></a>

### faceBlinder.see(file) ⇒ <code>Promise.&lt;Array.&lt;Face&gt;&gt;</code>
See faces from the image file.

FaceBlinder should init first, then can see faces.

[Example/see-face](https://github.com/zixia/face-blinder/blob/master/examples/see-face.ts)

**Kind**: instance method of [<code>FaceBlinder</code>](#FaceBlinder)  

| Param | Type |
| --- | --- |
| file | <code>string</code> | 

**Example**  
```js
const faceBlinder = new FaceBlinder()
await faceBlinder.init()
const imageFile = `${__dirname}/../examples/demo.jpg`
const faceList = await faceBlinder.see(imageFile)
console.log(faceList[0])
```
<a name="FaceBlinder+similar"></a>

### faceBlinder.similar(face, [threshold]) ⇒ <code>Promise.&lt;Array.&lt;Face&gt;&gt;</code>
Get All Similar Face from the database.

[Example/demo](https://github.com/zixia/face-blinder/blob/master/examples/demo.ts)

**Kind**: instance method of [<code>FaceBlinder</code>](#FaceBlinder)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| face | <code>Face</code> |  | the face to compare |
| [threshold] | <code>number</code> | <code>this.threshold</code> | threshold to judge two faces similarity, defatult is 0.75, you can change the number you prefer. |

**Example**  
```js
const faceList = await blinder.see(`${__dirname}/../examples/demo.jpg`)
const similarFaceList = await blinder.similar(faceList[i])
```
<a name="FaceBlinder+recognize"></a>

### faceBlinder.recognize(face) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
Recognize face and return all related face name(here equal to face md5) from database

**Kind**: instance method of [<code>FaceBlinder</code>](#FaceBlinder)  
**Returns**: <code>Promise.&lt;(string\|null)&gt;</code> - - faceNameList, a face md5 array  

| Param | Type |
| --- | --- |
| face | <code>Face</code> | 

**Example**  
```js
const faceList = await blinder.see(`${__dirname}/../examples/demo.jpg`)
const recognizedName = await blinder.recognize(faceList[0]) || 'Who?'
```
<a name="FaceBlinder+remember"></a>

### faceBlinder.remember(face, [name]) ⇒ <code>Promise.&lt;(void\|string\|null)&gt;</code>
Remeber the face.

**Kind**: instance method of [<code>FaceBlinder</code>](#FaceBlinder)  

| Param | Type | Description |
| --- | --- | --- |
| face | <code>Face</code> |  |
| [name] | <code>string</code> | if not null,  set the name for this face. <br>                          if null, the face name is face.md5 by default. |

<a name="FaceBlinder+forget"></a>

### faceBlinder.forget(face) ⇒ <code>Promise.&lt;void&gt;</code>
Forget the face in the database

**Kind**: instance method of [<code>FaceBlinder</code>](#FaceBlinder)  

| Param | Type |
| --- | --- |
| face | <code>Face</code> | 

<a name="FaceBlinder+file"></a>

### faceBlinder.file(face) ⇒ <code>string</code>
Save the face to file

[Example/see-face](https://github.com/zixia/face-blinder/blob/master/examples/see-face.ts)

**Kind**: instance method of [<code>FaceBlinder</code>](#FaceBlinder)  
**Returns**: <code>string</code> - - return file directory  

| Param | Type |
| --- | --- |
| face | <code>Face</code> | 

**Example**  
```js
const faceList = await faceBlinder.see(imageFile)
for (const face of faceList) {
  const fileName = await faceBlinder.file(face)
  console.log(`Save file to ${fileName}`)
}
```
<a name="FaceBlinder+face"></a>

### faceBlinder.face(md5) ⇒ <code>Promise.&lt;(Face\|null)&gt;</code>
Get face by md5

**Kind**: instance method of [<code>FaceBlinder</code>](#FaceBlinder)  

| Param | Type |
| --- | --- |
| md5 | <code>string</code> | 

<a name="FaceBlinder+list"></a>

### faceBlinder.list(md5Partial) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
Get face.md5 list from database based on partialmd5. Make it convenience for user find face by md5

**Kind**: instance method of [<code>FaceBlinder</code>](#FaceBlinder)  

| Param | Type |
| --- | --- |
| md5Partial | <code>string</code> | 

**Example**  
```js
let md5Partial = `2436` // just an example for a md5Partial, change a more similar partial as you like.
const md5List = await blinder.list(md5Partial)
if (md5List.length === 0) {
  console.log('no such md5')
} else if (md5List.length === 1) {
  consoel.log(`You find the face!, face md5: ${md5List[0]}`)
} else {
  const reply = [ `which md5 do you want?`, ...md5List,].join('\n')
  console.log(reply)
}
```
<a name="FaceBlinderOptions"></a>

## FaceBlinderOptions
Point Type

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| workdir | <code>string</code> | Workdir of the project, default: face-blinder.workdir |
| threshold | <code>number</code> | The number to judge the faces are the same one, default: 0.75 |

