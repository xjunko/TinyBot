const get_mode_detail = require('./get_mode_detail')

module.exports = ({id, mode, refresh}) => {
    let { link, check_type } = get_mode_detail({mode: mode})
    return {profile_link: `http://${check_type == 'bancho' ? 'osu.' : ''}${link}/u/${id}`,
            pfp_link: `http://a.${check_type == 'datenshi' ? link.substring(4) : link}/${id}?${refresh}`}
}