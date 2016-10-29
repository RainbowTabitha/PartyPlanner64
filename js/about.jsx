PP64.about = (function() {
  let About = class About extends React.Component {
    state = {}

    render() {
      let versionNum = "####VERSION####"; // Replaced during build.
      if (versionNum === "####VERS ION####".replace(" ", "")) // Tricky!
        versionNum = "unknown";

      let mplText;
      if (document.location.href.indexOf("mariopartylegacy") >= 0)
        mplText = "Hosted by"
      else
        mplText = "Visit";


      return (
        <div id="aboutForm">
          <div className="aboutHeader">
            <img src="img/logoloading.png" alt="PartyPlanner64" />
            <br />
            <span className="aboutVersion selectable">Version {versionNum}</span>
          </div>
          <br />
          <div className="aboutText">
            <span className="aboutTextLabel">Want more PartyPlanner64?</span>
            <ul>
              <li>Follow <a href="https://twitter.com/PartyPlanner64" target="_blank">@PartyPlanner64</a> on Twitter.</li>
              <li><a href="https://github.com/PartyPlanner64/PartyPlanner64" target="_blank">Contribute</a> to development on Github.</li>
              <li>Write or view <a href="https://github.com/PartyPlanner64/PartyPlanner64/issues" target="_blank">bugs and enhancement requests</a>.</li>
              <li>Read the <a href="https://github.com/PartyPlanner64/PartyPlanner64/wiki/Creating-a-Board">usage tutorial</a> or <a href="https://github.com/PartyPlanner64/PartyPlanner64/wiki">documentation</a>.</li>
            </ul>
          </div>
          <br />
          <br />
          <div className="aboutHeader">
            <span>{mplText}</span>
            <br />
            <a href="http://mariopartylegacy.com/" target="_blank"><img src="img/mpllogo.png" alt="Mario Party Legacy" /></a>
          </div>
          <div className="aboutText">
            <ul>
              <li>Check out discussion in the <a href="http://www.mariopartylegacy.com/forum/index.php?topic=15883.0" target="_blank">forum thread</a>.</li>
              <li>Post your creations to the <a href="http://www.mariopartylegacy.com/forum/index.php?action=downloads" target="_blank">downloads page</a>.</li>
            </ul>
          </div>
        </div>
      );

      //<div className="aboutText">
          //  <span className="aboutTextLabel">Special thanks to these contributors!</span>
          //  <ul>
          //    <li>Luke</li>
          //    <li>Dominic</li>
          //  </ul>
          //</div>
    }
  };

  return {
    About,
  };
})();
