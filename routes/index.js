const express = require('express');
const router = express.Router();
const axios = require('axios')
const userModel = require("../models/User")



//async function (req, res)
router.get("/user/signin/callback", async (req, res) => {
  //1. call back url from front request /login/oauth/authorize/:client_id
  const { query } = req;
  const { code } = query;
  let accessToken;
  const headersJSON = {
    'Accept': 'application/json'
  }

  if (!code) {
    return res.send({
      success: false,
      message: "no code recieved"
    })
  }

  //2. thanks to "code" we can request for access token to access data from user
  try {
    const { data: gitHubToken } = await axios.post("https://github.com/login/oauth/access_token",
      {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: code
      },
      { headers: headersJSON })

    accessToken = `token ${gitHubToken.access_token}`
    const { data: infoUser } = await axios.get("https://api.github.com/user", { headers: { Authorization: accessToken } })
   
    const { data: repositories } = await axios.get(`${infoUser.repos_url}?per_page=3`, { headers: { 'Accept': 'application/json' } })

    for (let i = 0; i < repositories.length; i++) {

      let { data: currentRepo } = await axios.get(`https://api.github.com/repos/${repositories[i].owner.login}/${repositories[i].name}/stats/contributors`, {
        headers: {
          Authorization: accessToken, headersJSON
        }
      })

      // let { data: starred } = await axios.get(`https://api.github.com/repos/${repositories[i].owner.login}/${repositories[i].name}/watchers`, {
      //   headers: {
      //     Authorization: accessToken, headersJSON
      //   }
      // })

      if(currentRepo[0])repositories[i].totalCommits = currentRepo[0].total;
      // repositories[i].starredRepos = starred;
    }

    const { data: organizations } = await axios.get("http://api.github.com/user/orgs", { headers: { Authorization: accessToken } })

    req.session.currentUser = { infoUser, repositories, organizations };
    res.redirect(process.env.REACT_DOMAIN)
  } catch (err) {
    console.log(err)
  }

})

router.get("/loggedIn", (req, res) => {
  if (req.session.currentUser) {
    return res.send({
      user: req.session.currentUser.infoUser,
      loginStatus: true,
      repositories: req.session.currentUser.repositories,
      organizations: req.session.currentUser.organizations
    })
  }
  res.send({ loginStatus: false })
})

router.get("/logout", (req, res) => {
  if (req.session.currentUser) {
    req.session.destroy();
    res.send({ loginStatus: false })
  } else {
    res.send({ errorMsg: "an error occured" })
  }
})



module.exports = router