FACE-BLINDER
------------

[![Powered by FaceNet](https://img.shields.io/badge/Powered%20By-FaceNet-green.svg)](https://github.com/huan/node-facenet) [![Powered by TypeScript](https://img.shields.io/badge/Powered%20By-TypeScript-blue.svg)](https://www.typescriptlang.org/) 

[![Build Status](https://travis-ci.com/huan/face-blinder.svg?branch=master)](https://travis-ci.com/huan/face-blinder) [![NPM Version](https://badge.fury.io/js/face-blinder.svg)](https://badge.fury.io/js/face-blinder) [![Downloads](http://img.shields.io/npm/dm/face-blinder.svg?style=flat-square)](https://npmjs.org/package/face-blinder)

Assitant Bot for Whom is Suffering form Face Blindess

![Face Blindess](https://huan.github.io/face-blinder/images/face-blindess.jpg)

> "Face blindness is a brain disorder characterized by the inability to recognize faces." - MedicineNet.com

INSTALL
-------
```
npm install face-blinder facenet numjs flash-store
```

### Peer Dependence
1. `facenet`
1. `numjs`
1. `flash-store`

EXAMPLE
-------
* try `npm run see` to see faces from image.   
* try `npm run similar` to get similar faces from two images.   
* try `npm run recogonize` to recogonize faces from two images.

The following example show you the basic function.
```ts
import { FaceBlinder } from 'face-blinder'

const faceBlinder = new FaceBlinder()
await faceBlinder.init()

const faceList  = await faceBlinder.see(`zhizunbao-zixia.jpg`)
await faceBlinder.remember(faceList[0], 'Zixia')
const recognizedZixia = await faceBlinder.recognize(faceList[0])
console.log(`Recognize Zixia result: ${recognizedZixia}`)

faceBlinder.quit()
```

more examples:

* [see-face](https://github.com/huan/face-blinder/blob/master/examples/see-face.ts): Recognize two faces from `zhizunbao-zixia.jpg`, then save them to local file.
* [find-similar-face](https://github.com/huan/face-blinder/blob/master/examples/find-similar-face.ts): Recognize face in `zixia.jpg` and get similar face from `zhizunbao-zixia.jpg`.     
* [recogonize-face](https://github.com/huan/face-blinder/blob/master/examples/recogonize-face.ts): Learn Zixia face from `zixia.jpg`, then recognize Zixia from `zhizunbao-zixia.jpg`.
* [wechaty-blinder](https://github.com/huan/wechaty-blinder): An interesting project connet [wechaty](github.com/chatie/wechaty) with [face-blinder](https://github.com/huan/face-blinder). Make face-blinder works on a personal wechat.

DOCUMENT
--------

See [auto generated docs](https://huan.github.io/face-blinder)

PROSOPAGNOSIA
-------------

Who has prosopagnosia, commonly called face blindness, which means he/she will have trouble recognizing familiar faces and learning to recognize new ones.

**7 signs and symptoms of face blindness / prosopagnosia**
> The list was compiled with the help of the Yahoo Faceblind group.

1. You have failed to recognize a close friend or family member, especially when you weren't expecting to see them.
1. When you meet someone new, you try to remember their hairstyle or a distinctive feature rather than their face.
1. Do you confuse characters in movies or on television more so than other people?
1. You have failed to recognize yourself in the mirror and/or have difficulty identifying yourself in photographs.
1. When someone casually waves or says hello in the street, you more often than not don't know who they are.
1. When someone gets a haircut, you may not recognize them when you see them again.
1. You have difficulty recognizing neighbors, friends, coworkers, clients, schoolmates (etc.) out of context.

SEE ALSO
--------

1. [I have face blindness and you might too](http://nypost.com/2017/07/21/i-have-face-blindness-and-you-might-too/)
1. [7 signs and symptoms of face blindness / prosopagnosia](https://www.testmybrain.org/do-you-suffer-from-face-blindness-seven-signs-and-symptoms-of-prosopagnosia/)


AUTHOR
------

Huan LI \<zixia@zixia.net\> (http://linkedin.com/in/zixia)

<a href="http://stackoverflow.com/users/1123955/zixia">
  <img src="http://stackoverflow.com/users/flair/1123955.png" width="208" height="58" alt="profile for zixia at Stack Overflow, Q&amp;A for professional and enthusiast programmers" title="profile for zixia at Stack Overflow, Q&amp;A for professional and enthusiast programmers">
</a>

COPYRIGHT & LICENSE
-------------------

* Code & Docs © 2017 Huan LI \<zixia@zixia.net\>
* Code released under the Apache-2.0 License
* Docs released under Creative Commons
