"use strict";
exports.__esModule = true;
var react_1 = require("react");
var image_1 = require("next/image");
var ui_1 = require("ui");
var Panel_1 = require("~/components/Panel");
var use_conf_data_1 = require("~/components/LaunchWeek/hooks/use-conf-data");
var TicketProfile_1 = require("./TicketProfile");
var TicketFooter_1 = require("./TicketFooter");
var common_1 = require("common");
function Ticket() {
    var _a = use_conf_data_1["default"](), user = _a.userData, showCustomizationForm = _a.showCustomizationForm, setShowCustomizationForm = _a.setShowCustomizationForm;
    var isMobile = common_1.useBreakpoint();
    var _b = user.golden, golden = _b === void 0 ? false : _b, _c = user.bg_image_id, bgImageId = _c === void 0 ? '1' : _c;
    var _d = react_1.useState(false), imageHasLoaded = _d[0], setImageHasLoaded = _d[1];
    var params = common_1.useParams();
    var sharePage = !!params.username;
    var fallbackImg = "/images/launchweek/lwx/tickets/lwx_ticket_bg_" + (golden ? 'platinum' : 'regular') + ".png";
    var ticketBg = {
        regular: {
            background: "/images/launchweek/lwx/tickets/lwx_ticket_bg_regular.png",
            background_mobile: "/images/launchweek/lwx/tickets/lwx_ticket_regular_mobile.png"
        },
        platinum: {
            background: "/images/launchweek/lwx/tickets/lwx_ticket_bg_platinum.png",
            background_mobile: "/images/launchweek/lwx/tickets/lwx_ticket_platinum_mobile.png"
        }
    };
    function handleCustomizeTicket() {
        setShowCustomizationForm && setShowCustomizationForm(!showCustomizationForm);
    }
    return (React.createElement(Panel_1["default"], { hasShimmer: true, outerClassName: "flex relative flex-col w-[300px] h-auto max-h-[480px] md:w-full md:max-w-none rounded-3xl !shadow-xl", innerClassName: "flex relative flex-col justify-between w-full transition-colors aspect-[1/1.6] md:aspect-[1.967/1] rounded-3xl bg-[#020405] text-left text-sm group/ticket", shimmerFromColor: "hsl(var(--border-strong))", shimmerToColor: "hsl(var(--background-default))" },
        !sharePage && (React.createElement(React.Fragment, null,
            React.createElement("button", { className: "absolute z-40 inset-0 w-full h-full outline-none", onClick: handleCustomizeTicket }),
            React.createElement("div", { className: "hidden md:flex opacity-0 translate-y-3 group-hover/ticket:opacity-100 group-hover/ticket:translate-y-0 transition-all absolute z-30 inset-0 m-auto w-10 h-10 rounded-full items-center justify-center bg-[#020405] border shadow-lg text-foreground" }, !showCustomizationForm ? React.createElement(ui_1.IconEdit2, { className: "w-4" }) : React.createElement(ui_1.IconX, { className: "w-4" })))),
        React.createElement("div", { className: "absolute inset-0 h-full p-6 md:p-12 z-30 flex flex-col justify-between w-full md:h-full flex-1 overflow-hidden" },
            React.createElement(TicketProfile_1["default"], null),
            React.createElement(TicketFooter_1["default"], null)),
        React.createElement(image_1["default"], { src: ticketBg[golden ? 'platinum' : 'regular'][!isMobile ? 'background' : 'background_mobile'], alt: "Launch Week X ticket background #" + bgImageId, placeholder: "blur", blurDataURL: fallbackImg, onLoad: function () { return setImageHasLoaded(true); }, loading: "eager", fill: true, className: ui_1.cn('absolute inset-0 object-cover object-right opacity-0 transition-opacity duration-1000', imageHasLoaded && 'opacity-100'), priority: true, quality: 100 })));
}
exports["default"] = Ticket;
