function handleErrors (error, req, res, next) { // 첫번째 argument는 오류에 대한 내용을 담음
    console.log(error);

    if (error.code === 404) {
        return res.redirect('/404');
    }

    return res.status(500).render('500');
}

module.exports = handleErrors; 