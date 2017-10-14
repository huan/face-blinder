FACE-BLINDER
------------

[![Powered by FaceNet](https://img.shields.io/badge/Powered%20By-FaceNet-green.svg)](https://github.com/zixia/node-facenet) [![Powered by TypeScript](https://img.shields.io/badge/Powered%20By-TypeScript-blue.svg)](https://www.typescriptlang.org/)

[![Build Status](https://travis-ci.org/zixia/face-blinder.svg?branch=master)](https://travis-ci.org/zixia/face-blinder) [![NPM Version](https://badge.fury.io/js/face-blinder.svg)](https://badge.fury.io/js/face-blinder) [![Downloads](http://img.shields.io/npm/dm/face-blinder.svg?style=flat-square)](https://npmjs.org/package/face-blinder)

Assitant Bot for Whom is Suffering form Face Blindess

![Face Blindess](https://zixia.github.io/face-blinder/images/face-blindess.jpg)

> "Face blindness is a brain disorder characterized by the inability to recognize faces." - MedicineNet.com

INSTALL
-------------
```
npm install
```

EXAMPLE
-------------
try `npm run demo`

The following example show you how to see face and get the similarity of the two face:
```ts
import { FaceBlinder } 		from 'face-blinder'

const faceBlinder = new FaceBlinder()
await faceBlinder.init()

const imageFile = `${__dirname}/../examples/image/demo.jpg`
const faceList = await faceBlinder.see(imageFile)
console.log(`See ${faceList.length} faces from the demofile and save them to the file. \n\n`)

// similar function
const similarFaceList = await faceBlinder.similar(faceList[0])
console.log(`Get Zixia similar faces: ${similarFaceList.length}, See it in ${fileName}. \n\n`)

faceBlinder.quit()
```

more examples:

[demo](https://github.com/zixia/face-blinder/blob/master/examples/demo.ts): Try see face, get similar face and recognize face.    
[face-see-and-save](https://github.com/zixia/face-blinder/blob/master/examples/see-face.ts): See faces from a image and save them to local file.     
[wechaty-blinder](https://github.com/zixia/wechaty-blinder): Connect with wechat using wechaty   

DOCUMENT
-------------

See [auto generated docs](https://zixia.github.io/face-blinder)

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
