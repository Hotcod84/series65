/* Series 65 study site: stands in for the claude.ai storage the pages were written for.
   Every page keeps its progress in one per-user document in Supabase ("progress"),
   merged entry by entry (newest wins), and listens for changes made on other devices. */
(function () {
  var SB = window.S65_client();
  var DOC = "progress";

  function userApi() {
    return {
      id: function () {
        return SB.auth.getSession().then(function (r) {
          var s = r && r.data && r.data.session;
          return s && s.user ? s.user.id : null;
        });
      }
    };
  }

  function fail(err) {
    var msg = (err && (err.message || err.details)) || "";
    var code = /not_granted|42501|permission/i.test(msg) ? "not_granted" : "unavailable";
    var e = new Error(msg || code); e.code = code; return e;
  }

  function merge(body) {
    return SB.rpc("sync_merge", { p_doc: DOC, p_patch: body }).then(function (r) {
      if (r.error) throw fail(r.error);
      return r.data;
    });
  }

  function makeRef() {
    return {
      set: merge,
      update: merge,
      onSnapshot: function (cb, errCb) {
        var busy = false, again = false;
        function pull() {
          if (busy) { again = true; return; }
          busy = true;
          SB.from("sync_doc").select("data").eq("doc", DOC).maybeSingle().then(function (r) {
            busy = false;
            if (r.error) { if (errCb) errCb(fail(r.error)); }
            else {
              var d = r.data ? r.data.data : null;
              cb({ exists: !!d, data: function () { return d; }, metadata: { fromCache: false } });
            }
            if (again) { again = false; pull(); }
          }, function (e) { busy = false; if (errCb) errCb(fail(e)); });
        }
        pull();
        SB.auth.getSession().then(function (r) {
          var uid = r && r.data && r.data.session && r.data.session.user.id;
          if (!uid) return;
          SB.channel("s65-progress-" + uid)
            .on("postgres_changes", { event: "*", schema: "public", table: "sync_doc", filter: "user_id=eq." + uid }, pull)
            .subscribe();
        });
        document.addEventListener("visibilitychange", function () { if (!document.hidden) pull(); });
        window.addEventListener("focus", pull);
        window.addEventListener("online", pull);
        setInterval(function () { if (!document.hidden) pull(); }, 45000);
        return function () {};
      }
    };
  }

  window.claude = window.claude || {};
  window.claude.use = function (name) {
    if (name === "db") return Promise.resolve({ doc: function () { return makeRef(); } });
    if (name === "user") return Promise.resolve(userApi());
    return Promise.resolve(null);
  };

  /* small way home on every page */
  function addHome() {
    if (document.getElementById("s65-home")) return;
    var a = document.createElement("a");
    a.id = "s65-home"; a.href = "index.html"; a.textContent = "← All pages";
    a.setAttribute("style", "position:fixed;left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:500;" +
      "background:#1B2A4A;color:#fff;font:600 13px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:8px 13px;border-radius:999px;" +
      "text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.18);opacity:.9");
    document.body.appendChild(a);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addHome); else addHome();
})();
