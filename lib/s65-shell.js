/* Series 65 study site: sign in once per device, then open the requested page.
   The question pages are stored encrypted; the key is released only to the signed-in, allowed account. */
(function () {
  var SB = window.S65_client();
  var VERSION = window.S65_VERSION || "1";

  var CSS = "body{margin:0;background:#f0f2f5;color:#1a1a2e;font:17px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
    ".s65b{max-width:430px;margin:9vh auto 0;padding:0 18px}" +
    ".s65b .card{background:#fff;border-radius:14px;padding:26px 24px;box-shadow:0 6px 24px rgba(27,42,74,.12);border-top:5px solid #C9A84C}" +
    ".s65b h1{margin:0 0 4px;font-size:24px;color:#1B2A4A}.s65b p{margin:0 0 16px;color:#4b5563;font-size:15px}" +
    ".s65b label{display:block;font-weight:600;font-size:14px;margin:12px 0 6px;color:#1B2A4A}" +
    ".s65b input{width:100%;box-sizing:border-box;font:17px/1.4 inherit;padding:12px 13px;border:2px solid #d1d5db;border-radius:9px}" +
    ".s65b input:focus{outline:none;border-color:#1B2A4A}" +
    ".s65b button{width:100%;margin-top:18px;font:600 17px/1 inherit;padding:14px;border:0;border-radius:9px;background:#1B2A4A;color:#fff;cursor:pointer}" +
    ".s65b .link{background:none;color:#1B2A4A;text-decoration:underline;font-weight:500;font-size:14px;padding:8px;margin-top:8px}" +
    ".s65b .msg{min-height:22px;margin-top:12px;font-size:14.5px;color:#991b1b}.s65b .ok{color:#166534}" +
    ".s65b .wait{text-align:center;padding:40px 0;color:#1B2A4A;font-weight:600}";

  function frame(inner) {
    document.body.innerHTML = "<style>" + CSS + "</style><div class='s65b'><div class='card'>" + inner + "</div></div>";
  }
  function waitScreen(t) { frame("<div class='wait'>" + t + "</div>"); }

  function loginScreen(after, note) {
    frame("<h1>Series 65 study</h1><p>Sign in once on this device. Your answers then follow you to every device you sign in on.</p>" +
      "<form id='f'><label for='e'>Email</label><input id='e' type='email' autocomplete='username' required>" +
      "<label for='p'>Password</label><input id='p' type='password' autocomplete='current-password' required>" +
      "<button type='submit'>Sign in</button></form>" +
      "<button class='link' id='fp' type='button'>Forgot password? Email me a reset link</button>" +
      "<div class='msg' id='m'>" + (note || "") + "</div>");
    var e = document.getElementById("e"), p = document.getElementById("p"), m = document.getElementById("m");
    e.value = window.S65_SUPABASE.email || "";
    (e.value ? p : e).focus();
    document.getElementById("f").addEventListener("submit", function (ev) {
      ev.preventDefault(); m.className = "msg"; m.textContent = "Signing in…";
      SB.auth.signInWithPassword({ email: e.value.trim(), password: p.value }).then(function (r) {
        if (r.error) { m.textContent = r.error.message === "Invalid login credentials" ? "That email and password don't match. Try again, or use the reset link." : r.error.message; return; }
        after();
      });
    });
    document.getElementById("fp").addEventListener("click", function () {
      m.className = "msg"; m.textContent = "Sending…";
      var back = location.href.split("#")[0].replace(/[^\/]*$/, "") + "index.html#reset";
      SB.auth.resetPasswordForEmail(e.value.trim(), { redirectTo: back }).then(function (r) {
        if (r.error) { m.textContent = r.error.message; return; }
        m.className = "msg ok"; m.textContent = "Check your email for the reset link.";
      });
    });
  }

  function b64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }

  function openPage(page) {
    waitScreen("Opening…");
    SB.from("content_key").select("k").eq("id", "v2").maybeSingle().then(function (r) {
      if (r.error || !r.data) {
        loginScreen(function () { openPage(page); }, "This account isn't set up for the study pages. Sign in with your own email.");
        return;
      }
      var keyBytes = b64(r.data.k);
      Promise.all([
        fetch("data/" + page + ".enc?v=" + VERSION, { cache: "default" }).then(function (x) { if (!x.ok) throw new Error("download " + x.status); return x.arrayBuffer(); }),
        crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"])
      ]).then(function (a) {
        var buf = new Uint8Array(a[0]);
        return crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.slice(0, 12) }, a[1], buf.slice(12));
      }).then(function (plain) {
        var html = new TextDecoder().decode(plain);
        document.open(); document.write(html); document.close();
      }).catch(function (err) {
        frame("<h1>Couldn't open the page</h1><p>" + String(err && err.message || err) + "</p><button onclick='location.reload()'>Try again</button>");
      });
    });
  }

  window.S65Boot = function (page) {
    waitScreen("Loading…");
    SB.auth.getSession().then(function (r) {
      if (r && r.data && r.data.session) openPage(page);
      else loginScreen(function () { openPage(page); });
    });
  };
  window.S65LoginScreen = loginScreen;
  window.S65Frame = frame;
})();
