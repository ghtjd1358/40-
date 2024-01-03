const models = require('../models/index');
const Words = models.Words;
const ConfirmWords = models.ConfirmWords;

async function getAddWord (req, res) {
    const words = await ConfirmWords.findAll();
    res.render('addword', {words: words});
}

async function addWord (req, res, next) {
    const { name : word, mean : meaning} = req.body;
    const userid = req.session.userid;
    let result;
    if (!userid) {
        return res.json({msg: '로그인 후 이용해주세요.', isError: true})
    }
    if (!word || word.trim().length < 1 || !meaning || meaning.trim().length < 1) {
        return res.json({msg: '단어와 뜻을 입력해주세요.', isError: true})
    }
        try {
            result = await Words.create({
              userid : userid,
              word : word,
              meaning : meaning
            })
            res.json({msg: '신청 완료! 관리자의 승인 후 등록됩니다.', isError: false})
        } catch (err) {
            next(err);
        }
      
    }

async function getKeyboard(req, res, next) {
    const words = await ConfirmWords.findAll();
    // for (const word of words) {
    //     console.log(word.dataValues);
    // }
    let dataVal = words.map(item => item.dataValues);
    console.log(dataVal);


    res.render('keyboard/keyboard', {words: words});
}

module.exports = {
    getAddWord : getAddWord,
    addWord : addWord,
    getKeyboard: getKeyboard
}