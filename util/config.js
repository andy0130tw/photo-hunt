/**
 * Photo Hunt Crypto
 *
 * Config file to spawn encrypted data and its passwords.
 *
 * Instruction:
 * In each entry you specify an image and some metadata,
 *  and it will be encrypted by a randomly-generated
 *  password and an IV.
 * The entry will be encrypted again using different
 *  passwords and IVs, into multiple keyfiles.
 *  All information for decrypting sources will then be
 *  saved into a JSON file.
 *
 * @author Andy Pan
 */

var config = {
  'opening': {
    meta: {
      title: '尋寶開始！',
      text: '以下的每一關會有一張圖片，請用這張圖片為線索，找到拍攝的地點，會有人告訴你找到下一組密碼！',
      next: ['stage1']
    }
  },
  'stage1': {
    image: ['stage1.jpg'],
    meta: {
      title: '關卡一',
      desc: '',
      hint: '國光客運大多數路線在舊稱的台北東站和台北西站發車。今天你要找的是台北西站。\n'
          + '台北西站A棟的飲料店是橘色招牌的coco都可，而B棟是紫色招牌的日出茶太。',
      next: ['stage2a', 'stage2b', 'stage2c']
    }
  },
  'stage2a': {
    image: ['stage2a.jpg'],
    meta: {
      title: '關卡二 a',
      desc: '',
      hint: '上面有個黑黑的高架道路對吧？那個是市民大道。\n'
          + '當初拍攝的人如果轉身，他將看到京站的門口。'
    },
    next: ['stage4']
  },
  'stage2b': {
    image: ['stage2b.jpg'],
    meta: {
      title: '關卡二 b',
      desc: '',
      hint: '上面有個黑黑的高架道路對吧？那個是市民大道。\n'
          + '當初拍攝的人如果轉身，他將看到京站的門口。'
    },
    next: ['stage3']
  },
  'stage2c': {
    image: ['stage2c.jpg'],
    meta: {
      title: '關卡二 c',
      desc: '',
      hint: '上面有個黑黑的高架道路對吧？那個是市民大道。\n'
          + '當初拍攝的人如果轉身，他將看到京站的門口。'
    },
    next: ['stage3']
  },
  'stage3': {
    image: ['stage3.jpg'],
    meta: {
      title: '關卡三',
      desc: '',
      hint: '圖中有個台鐵售票處對吧？據我所知，台北車站內的台鐵售票處只有在一樓跟地下三樓。\n'
          + '照片中最末端有個門，那麼代表他在地面。'
    },
    next: ['stage4a', 'stage4b', 'stage4c']
  },
  'stage4a': {
    image: ['stage4a.jpg'],
    meta: {
      title: '關卡四 a',
      desc: '',
      hint: '這在捷運台北車站內。順帶一提，捷運台北車站的範圍大致上是從B2到B4。\n'
          + '捷運台北車站有三個詢問處。兩個在B2，一個在B3。拍攝者站的地方在詢問處2。'
    },
    next: ['stage5']
  },
  'stage4b': {
    image: ['stage4b.jpg'],
    meta: {
      title: '關卡四 b',
      desc: '',
      hint: '這在捷運台北車站內。順帶一提，捷運台北車站的範圍大致上是從B2到B4。\n'
          + '捷運台北車站有三個詢問處。兩個在B2，一個在B3。拍攝者站的地方在詢問處2。'
    },
    next: ['stage5']
  },
  'stage4c': {
    image: ['stage4c.jpg'],
    meta: {
      title: '關卡四 c',
      desc: '',
      hint: '這在捷運台北車站內。順帶一提，捷運台北車站的範圍大致上是從B2到B4。\n'
          + '捷運台北車站有三個詢問處。兩個在B2，一個在B3。拍攝者站的地方在詢問處2。'
    },
    next: ['stage5']
  },
  'stage5': {
    image: ['stage5.jpg'],
    meta: {
      title: '關卡五',
      desc: '',
      hint: '在開挖這個地點時，意外地發現清代古蹟。\n'
          + '走出這個捷運站，你會發現那兒是某些人口中的聖地。'
    },
    next: ['goal']
  },
  'goal': {
    meta: {
      title: '終點',
      text: '恭喜成功完成尋寶！感謝您參與本次遊戲！',
      goal: true
    }
  }
};

//
module.exports = {
  defs: config,
  count: 8,
  initial: ['opening']
};
