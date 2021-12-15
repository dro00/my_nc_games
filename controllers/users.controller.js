const { selectUsers, selectUserFromId } = require("../models/users.model");
const { checksIfExists } = require(`../models/utils.model`);

exports.getUsers = (req, res, next) => {
  selectUsers()
    .then((users) => {
      res.status(200).send({ users });
    })
    .catch(next);
};

exports.getUserById = (req, res, next) => {
  const { username } = req.params;

  Promise.all([
    selectUserFromId(username),
    checksIfExists(`users`, `username`, username),
  ])
    .then(([user]) => {
      res.status(200).send({ user: user[0] });
    })
    .catch(next);
};