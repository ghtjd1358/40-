const bcrypt = require("bcrypt");
const models = require("../models/index");

const checkJwt = require("../utility/checkJwt");
const User = models.User;
const getCookieConfig = require("../config/cookie.config");
const clearUserInfo = require("../utility/clearUserInfo");

function getIndex(req, res) {
  res.render("index2");
}

const culture = (req, res) => {
  res.render("culture");
};

const community = (req, res) => {
  res.render("community");
};

const library = (req, res) => {
  res.render("library");
};

function getSignup(req, res) {
  res.render("signup");
}

async function existsAlready(req, res) {
  if (req.body.userid.trim().length <= 3) {
    return res.json({
      msg: "아이디를 4자 이상으로 입력해주세요.",
      isUnique: false,
    });
  }
  const existingUser = await User.findOne({
    where: { userid: req.body.userid },
  });

  if (existingUser) {
    res.json({ msg: "이미 존재하는 아이디입니다.", isUnique: false });
  } else {
    res.json({ msg: "아이디 생성 가능합니다.", isUnique: true });
  }
}

async function signup(req, res) {
  const { userid, password, confirmPassword, name, isUnique } = req.body;

  const existingUser = await User.findOne({
    where: { userid: req.body.userid },
  });
  if (!isUnique || isUnique === false || existingUser) {
    return res.json({
      msg: "중복검사를 실시하지 않았거나 이미 존재하는 아이디입니다.",
      isError: true,
    });
  }

  if (!userid || userid.trim().length <= 3) {
    return res.json({
      msg: "아이디를 4자 이상으로 입력해주세요.",
      isError: true,
    });
  }

  if (!password || password.trim().length <= 5) {
    return res.json({
      msg: "비밀번호를 6자 이상으로 입력해주세요.",
      isError: true,
    });
  }

  if (!(password === confirmPassword)) {
    return res.json({
      msg: "비밀번호와 비밀번호 확인이 다릅니다.",
      isError: true,
    });
  }

  if (!name || name.trim().length < 2) {
    return res.json({
      msg: "두 글자 이상의 이름을 입력해주세요.",
      isError: true,
    });
  }

  const hashPW = bcrypt.hashSync(password, 12);

  const result = await User.create({
    userid: userid,
    name: name,
    password: hashPW,
  });

  return res.json({ msg: "완료.", isError: false });
  // 프론트에서 res.data.isError가 true면 => redirect('/');
}

function getLogin(req, res) {
  res.render("login");
}

async function login(req, res) {
  const { userid, password } = req.body;

  if (!userid || userid.trim().length === 0) {
    return res.json({ msg: "아이디를 입력해주세요.", isError: true });
  }

  if (!password || password.trim().length === 0) {
    return res.json({ msg: "비밀번호를 입력해주세요.", isError: true });
  }

  const existingUser = await User.findOne({ where: { userid: userid } });
  if (!existingUser) {
    return res.json({ msg: "아이디 혹은 비밀번호가 다릅니다.", isError: true });
  }

  if (!bcrypt.compareSync(password, existingUser.password)) {
    return res.json({ msg: "아이디 혹은 비밀번호가 다릅니다.", isError: true });
  }

  // 데이터베이스의 토큰 업데이트
  newRefreshToken = checkJwt.makeRefreshJwt(userid, existingUser.name);
  res.cookie("refreshToken", newRefreshToken, getCookieConfig());

  await User.update(
    {
      RefreshToken: newRefreshToken,
    },
    {
      where: { userid: userid },
    }
  );

  res.json({ msg: "성공", isError: false });
}

function logout(req, res) {
  res.clearCookie(
    "refreshToken",
    req.signedCookies.refreshToken,
    getCookieConfig()
  );
  clearUserInfo(req, res);
  res.send("완료");
}

async function getMyPage(req, res) {
  const userInfo = await User.findOne({
    where: { userid: req.session.userid },
    attributes: ["userid", "name"],
  });
  res.render("MyPage", { userInfo: userInfo });
}

async function changeUserName(req, res) {
  const newUserName = req.body.name;

  try {
    await User.update(
      {
        name: newUserName,
      },
      {
        where: { userid: req.session.userid },
      }
    );
    res.json({ msg: "이름 변경이 완료되었습니다.", isError: false });
  } catch (err) {
    res.json({
      msg: "오류가 발생하였습니다. 새로고침 후 다시 시도해주세요",
      isError: true,
    });
  }
}

async function changeUserPassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const userPassword = await User.findOne({
    where: { userid: req.session.userid },
    attributes: ["password"],
  });

  const result = bcrypt.compareSync(currentPassword, userPassword.password);
  if (!result) {
    return res.json({ msg: "현재 비밀번호가 다릅니다.", isError: true });
  }

  if (newPassword.trim().length < 6 || !newPassword) {
    return res.json({
      msg: "비밀번호를 6자 이상으로 입력해주세요.",
      isError: true,
    });
  }

  if (!(newPassword === confirmPassword)) {
    return res.json({
      msg: "새 비밀번호와 확인 비밀번호가 다릅니다.",
      isError: true,
    });
  }

  if (bcrypt.compareSync(newPassword, userPassword.password)) {
    return res.json({
      msg: "이전 비밀번호와 동일한 비밀번호입니다.",
      isError: true,
    });
  }

  const hashedNewPassword = bcrypt.hashSync(newPassword, 12);

  try {
    await User.update(
      {
        password: hashedNewPassword,
      },
      {
        where: { userid: req.session.userid },
      }
    );
    return res.json({ msg: "비밀번호 변경이 완료되었습니다.", isError: false });
  } catch (err) {
    return res.json({
      msg: "오류가 발생하였습니다. 새로고침 후 다시 시도해주세요",
      isError: true,
    });
  }
}

async function deleteUser(req, res) {
  try {
    await User.destroy({
      where: { userid: req.session.userid },
    });

    res.clearCookie(
      "refreshToken",
      req.signedCookies.refreshToken,
      getCookieConfig()
    );
    clearUserInfo(req, res);
    res.json({
      msg: "삭제완료",
      isError: false,
    });
  } catch (err) {
    res.json({
      msg: "오류가 발생하였습니다. 새로고침 후 다시 시도해주세요",
      isError: true,
    });
  }
}

module.exports = {
  getSignup: getSignup,
  signup: signup,
  existsAlready: existsAlready,
  getLogin: getLogin,
  login: login,
  getIndex: getIndex,
  logout: logout,
  culture: culture,
  community: community,
  getMyPage: getMyPage,
  changeUserName: changeUserName,
  changeUserPassword: changeUserPassword,
  deleteUser: deleteUser,
  library: library,
};
