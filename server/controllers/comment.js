const COMMENT = require('mongoose').model('Comment');
const PLANT = require('mongoose').model('Plant');
const USER = require('mongoose').model('User');

const PAGE_LIMIT = 5;

function validateCommentForm(payload) {
    let errors = {};
    let isFormValid = true;

    if (!payload || typeof payload.content !== 'string' || payload.content.trim().length < 3) {
        isFormValid = false;
        errors.content = 'Comment must be more than 3 symbols long.';
    }

    return {
        success: isFormValid,
        errors
    };
}

module.exports = {
    getComments: (req, res) => {
        let plantId = req.params.plantId;
        let skipCount = !isNaN(Number(req.params.skipCount))
            ? Number(req.params.skipCount)
            : 0;

        COMMENT
            .find({ plant: plantId })
            .populate({ path: 'user', select: 'username avatar' })
            .sort({ creationDate: -1 })
            .skip(skipCount)
            .limit(PAGE_LIMIT)
            .then((comments) => {
                res.status(200).json({
                    message: '',
                    data: comments
                });
            })
            .catch((err) => {
                console.log(err);
                return res.status(400).json({
                    message: 'Something went wrong, please try again.'
                });
            });
    },

    getLatestFiveByUser: (req, res) => {
        let userId = req.params.userId;

        COMMENT
            .find({ user: userId })
            .populate('plant')
            .sort({ creationDate: -1 })
            .limit(5)
            .then((comments) => {
                res.status(200).json({
                    message: '',
                    data: comments
                });
            })
            .catch((err) => {
                console.log(err);
                return res.status(400).json({
                    message: 'Something went wrong, please try again.'
                });
            });
    },

    add: (req, res) => {
        let plantId = req.params.plantId;
        let userId = req.user.id;
        let comment = req.body.content;

        let validationResult = validateCommentForm(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                message: 'Comment form validation failed!',
                errors: validationResult.errors
            });
        }

        USER.findById(userId).then((user) => {
            if (!user || user.isCommentsBlocked) {
                return res.status(401).json({
                    message: 'Sorry, but you\'re not allowed to comment on products'
                });
            }

            PLANT.findById(plantId).then((plant) => {
                if (!plant) {
                    return res.status(400).json({
                        message: 'There is no product with the given id in our database.'
                    });
                }

                COMMENT.create({ content: comment }).then((newComment) => {
                    plant.comments.push(newComment._id);
                    newComment.plant = plant._id;
                    newComment.user = userId;
                    user.commentsCount += 1;

                    user.save();
                    plant.save();
                    newComment.save().then(() => {
                        COMMENT
                            .findById(newComment._id)
                            .populate({ path: 'user', select: 'username avatar' })
                            .then((comment) => {
                                return res.status(200).json({
                                    message: 'Comment posted successfully!',
                                    data: comment
                                });
                            });
                    });
                }).catch((err) => {
                    console.log(err);
                    return res.status(400).json({
                        message: 'Something went wrong, please try again.'
                    });
                });
            });
        });
    },

    edit: (req, res) => {
        let commentId = req.params.commentId;
        let userId = req.user.id;
        let editedComment = req.body.content;

        let validationResult = validateCommentForm(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                message: 'Comment form validation failed!',
                errors: validationResult.errors
            });
        }

        USER.findById(userId).then((user) => {
            if (!user || user.isCommentsBlocked) {
                return res.status(401).json({
                    message: 'Sorry, but you\'re not allowed to comment on products'
                });
            }

            COMMENT
                .findById(commentId)
                .populate({ path: 'user', select: 'username avatar' })
                .then((comment) => {
                    if (!comment) {
                        return res.status(400).json({
                            message: 'There is no comment with the given id in our database.'
                        });
                    }

                    if (comment.user._id.toString() !== userId && !req.user.isAdmin) {
                        return res.status(401).json({
                            message: 'You\'re not allowed to edit other user comments!'
                        });
                    }

                    comment.content = editedComment;
                    comment.save();

                    return res.status(200).json({
                        message: 'Comment edited successfully!',
                        data: comment
                    });
                })
                .catch((err) => {
                    console.log(err);
                    return res.status(400).json({
                        message: 'Something went wrong, please try again.'
                    });
                });
        });
    },

    delete: (req, res) => {
        let commentId = req.params.commentId;
        let userId = req.user.id;

        COMMENT.findById(commentId).then((comment) => {
            if (!comment) {
                return res.status(400).json({
                    message: 'There is no comment with the given id in our database.'
                });
            }

            if (comment.user.toString() !== userId && !req.user.isAdmin) {
                return res.status(401).json({
                    message: 'You\'re not allowed to delete other user comments!'
                });
            }

            COMMENT.findByIdAndRemove(comment._id).then(() => {
                PLANT.update({ _id: comment.plant }, { $pull: { comments: comment._id } }).then(() => {
                    USER.findById(req.user.id).then((user) => {
                        user.commentsCount -= 1;
                        user.save();
                        return res.status(200).json({
                            message: 'Comment deleted successfully!'
                        });
                    });
                });
            });
        }).catch((err) => {
            console.log(err);
            return res.status(400).json({
                message: 'Something went wrong, please try again.'
            });
        });
    }
};