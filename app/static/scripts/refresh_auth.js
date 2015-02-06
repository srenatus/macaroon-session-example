var MacaroonsBuilder = require('macaroons.js').MacaroonsBuilder;
var Macaroon = require('macaroons.js').Macaroon;
var moment = require('moment-interval');

function recieveAuthRefreshRequest(origin, discharge_secret, duration)
{
  function reciever(event) {

    if (event.origin !== origin)
      return;

    console.log('Recieved refresh request.');
    request = JSON.parse(event.data)

    var auth_macaroon_serialized = request['auth_macaroon_serialized'];
    var session_signature = request['session_signature'];

    var old_auth_macaroon = MacaroonsBuilder.deserialize(auth_macaroon_serialized);

    var expiry = moment.interval(moment.utc(), moment.duration(duration)).end().toISOString();

    var macaroon = new MacaroonsBuilder(
      old_auth_macaroon.location, discharge_secret, old_auth_macaroon.identifier)
        .add_first_party_caveat("time < " + expiry)
        .getMacaroon();

    var root = new Macaroon('0', '0', new Buffer(session_signature, 'hex'), [])

    var protected_discharge = new MacaroonsBuilder(root)
        .prepare_for_request(macaroon)
        .getMacaroon();

    var response = {
      "protected_discharge": protected_discharge.serialize(),
      "expires": expiry
    }
    event.source.postMessage(JSON.stringify(response), event.origin);
  }
  return reciever
}

window.recieveAuthRefreshRequest = recieveAuthRefreshRequest

