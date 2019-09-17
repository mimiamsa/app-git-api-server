const express = require('express');
const router = express.Router();
const axios = require('axios')
const userModel = require("../models/User")

router.get("/", (req, res) => {
  res.send("hello home")
})


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

    //
    //
    // la reponse d'axios = un object => response = {headers: "XXXXX", data:"XXXXXX", port: "dazdzadada" }
    // 
    // quand tu destructure cet object tu sellections la clé ainsi,  => const response = {data : {}};
    //  tu peux renommer la clé                                      => const {data} = response;
    //                                                               => const {data: toto} = response;
    //
    const { data: repositories } = await axios.get(`${infoUser.repos_url}?per_page=3`, { headers: { 'Accept': 'application/json' } })

    for (let i = 0; i < repositories.length; i++) {

      let { data: currentRepo } = await axios.get(`https://api.github.com/repos/${repositories[i].owner.login}/${repositories[i].name}/stats/contributors`, {
        headers: {
          Authorization: accessToken, headersJSON
        }
      })
      repositories[i].totalCommits = currentRepo[0].total;
    }
    console.log("organizations====>", infoUser.organizations_url)
    const { data: organizations } = await axios.get(infoUser.organizations_url, {
      headers: {
        Authorization: accessToken, headersJSON
      }
    })
    console.log("ORGA ====>", organizations)
    req.session.currentUser = { infoUser, repositories, organizations };
    res.redirect("http://localhost:3000")
  } catch (err) {
    console.log(err)
  }
  // await totalCommitsPerRepo();
  // console.log(reposArray)
  //  reposArray.forEach( async repo => {
  //   // Get repos number of commits
  //   const { data: currentRepo } =  await axios.get(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/stats/contributors`, {
  //     headers: {
  //       Authorization: accessToken, headersJSON
  //     }
  //   })
  //    currentCommit = currentRepo[0].total
  //   console.log(currentRepo[0].total,"this happens after")
  // });
  //comment tu vas faire pour attendre la loop
  // res.send("vvv")
  // axios.post("https://github.com/login/oauth/access_token",
  //   {
  //     client_id: process.env.CLIENT_ID,
  //     client_secret: process.env.CLIENT_SECRET,
  //     code: code
  //   },
  //   { headers: headersJSON })
  //   .then(apiRes => {
  //     const data = apiRes.data
  //     accesToken = `token ${data.access_token}`
  //     // GET user infos thanks to access token 
  //     axios.get("https://api.github.com/user", { headers: { Authorization: accesToken } })
  //       .then(apiRes => {
  //         // Storing the user in req.session
  //         req.session.currentUser = { token: accesToken, userinfos: apiRes.data }
  //         // Get repos infos
  //         axios.get(`${apiRes.data.repos_url}?per_page=3`, { headers: { 'Accept': 'application/json' } })
  //           .then(repoRes => {
  //             const reposArray = repoRes.data
  //             reposArray.forEach(repo => {
  //               // Get repos number of commits
  //               axios.get(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/stats/contributors`, {
  //                 headers: {
  //                   Authorization: accesToken, headersJSON
  //                 }
  //               })
  //                 .then(commitRes => { 
  //                   console.log("====> commits", commitRes.data[0].total) 
  //                 })
  //                 .catch(commitErr => {
  //                   console.log(commitErr)
  //                 })
  //             })
  //           })
  //           .catch(repoResError => {
  //             console.log(repoResError)
  //           })


  //         res.redirect("http://localhost:3000")
  //         // res.send(apiRes.data)
  //         // res.send(apiRes.data)
  //       })
  //       .catch(apiErr => {
  //         console.log(apiErr)
  //       })
  //   })
  //   .catch(apiErr => {
  //     console.log(apiErr)
  //   })
})

router.get("/loggedIn", (req, res) => {
  // console.log("loggedIn Route", req.session.currentUser.infos)
  if (req.session.currentUser) {
    // console.log("req session", req.session.currentUser)
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
  // console.log(req.session.currentUser)
  if (req.session.currentUser) {
    req.session.destroy();
    res.send({ loginStatus: false })
  } else {
    res.send({ errorMsg: "an error occured" })
  }
})

// router.get("/user/", (req, res) => {
//   axios.get("https://github.com/user", { 'Authorization': accesToken })
//     .then(apiRes => {
//       console.log("user query response", apiRes.data)
//       res.send(apiRes.data)
//     })
//     .catch(apiErr => {
//       console.log(apiErr)
//     })
// })


module.exports = router