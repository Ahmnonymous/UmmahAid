import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import withRouter from "../Common/withRouter";

//i18n
import { withTranslation } from "react-i18next";
import SidebarContent from "./SidebarContent";

import { Link } from "react-router-dom";

// Brand logos (keep favicon as-is; these only affect in-app chrome)
import ummahAidDark from "../../assets/images/UmmahAid-dark.png";
import ummahAidLight from "../../assets/images/UmmahAid-light.png";
import { leftSideBarThemeTypes } from "../../constants/layout";

const Sidebar = (props) => {
  // Decide which logo variant to show based on "Left Sidebar Color Options"
  const sidebarTheme = props.layout?.leftSideBarTheme;
  const useLightLogo =
    sidebarTheme === leftSideBarThemeTypes.DARK ||
    sidebarTheme === leftSideBarThemeTypes.COLORED ||
    sidebarTheme === leftSideBarThemeTypes.WINTER ||
    sidebarTheme === leftSideBarThemeTypes.LADYLIP ||
    sidebarTheme === leftSideBarThemeTypes.PLUMPLATE ||
    sidebarTheme === leftSideBarThemeTypes.STRONGBLISS ||
    sidebarTheme === leftSideBarThemeTypes.GREATWHALE;

  const activeLogo = useLightLogo ? ummahAidLight : ummahAidDark;

  return (
    <React.Fragment>
      <div className="vertical-menu">
        <div className="navbar-brand-box">
          <Link to="/" className="logo logo-dark">
            <span className="logo-sm">
              <img src={activeLogo} alt="UmmahAid" height="90" />
            </span>
            <span className="logo-lg">
              <img src={activeLogo} alt="UmmahAid" height="100" />
            </span>
          </Link>

          <Link to="/" className="logo logo-light">
            <span className="logo-sm">
              <img src={activeLogo} alt="UmmahAid" height="90" />
            </span>
            <span className="logo-lg">
              <img src={activeLogo} alt="UmmahAid" height="100" />
            </span>
          </Link>
        </div>
        <div data-simplebar className="h-100">
          {props.type !== "condensed" ? <SidebarContent /> : <SidebarContent />}
        </div>

        <div className="sidebar-background"></div>
      </div>
    </React.Fragment>
  );
};

Sidebar.propTypes = {
  type: PropTypes.string,
};

const mapStatetoProps = (state) => {
  return {
    layout: state.Layout,
  };
};
export default connect(
  mapStatetoProps,
  {}
)(withRouter(withTranslation()(Sidebar)));
