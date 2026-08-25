from pathlib import Path
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:5173"
SCREEN_DIR = Path("/tmp/akar-aroma-qa")
SCREEN_DIR.mkdir(parents=True, exist_ok=True)


def journey_scroll(page, progress):
    page.evaluate(
        """progress => {
          const root = document.querySelector('.journey');
          const distance = root.offsetHeight - window.innerHeight;
          window.scrollTo(0, root.offsetTop + distance * progress);
        }""",
        progress,
    )
    page.wait_for_timeout(1000)


def wait_for_app(page, expects_video=True):
    page.wait_for_load_state("domcontentloaded")
    if expects_video:
        page.wait_for_selector(".media__video.is-ready", timeout=60000)
    else:
        page.wait_for_selector(".media__still", timeout=10000)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/google-chrome")

    desktop = browser.new_context(viewport={"width": 1440, "height": 900})
    page = desktop.new_page()
    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.goto(URL)
    wait_for_app(page)
    page.screenshot(path=str(SCREEN_DIR / "desktop-start.png"))

    titles = []
    video_times = []
    for progress in (0.0, 0.25, 0.5, 0.75, 0.99):
        journey_scroll(page, progress)
        titles.append(page.locator(".scene-copy h1").inner_text())
        video_times.append(page.locator("video").evaluate("video => video.currentTime"))

    page.screenshot(path=str(SCREEN_DIR / "desktop-end.png"))
    video_state = page.locator("video").evaluate(
        """video => ({
          srcIsBlob: video.currentSrc.startsWith('blob:'),
          duration: video.duration,
          seekableEnd: video.seekable.length ? video.seekable.end(0) : 0,
          width: video.videoWidth,
          height: video.videoHeight
        })"""
    )

    expected_fragments = ["lereng", "Merah", "Matahari", "Panas", "Satu cangkir"]
    assert all(fragment.lower() in title.lower() for fragment, title in zip(expected_fragments, titles)), titles
    assert all(later > earlier for earlier, later in zip(video_times, video_times[1:])), video_times
    assert video_state["srcIsBlob"] is True, video_state
    assert 25.9 <= video_state["duration"] <= 26.1, video_state
    assert video_state["seekableEnd"] > 25.9, video_state
    assert (video_state["width"], video_state["height"]) == (1920, 1080), video_state
    assert not console_errors, console_errors
    desktop.close()

    mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
    phone = mobile.new_page()
    phone.goto(URL)
    wait_for_app(phone)
    journey_scroll(phone, 0.5)
    phone.screenshot(path=str(SCREEN_DIR / "mobile-middle.png"))
    mobile_metrics = phone.evaluate(
        """() => ({
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          titleVisible: !!document.querySelector('.scene-copy h1')?.getBoundingClientRect().height,
          routeVisible: getComputedStyle(document.querySelector('.route')).display !== 'none'
        })"""
    )
    assert mobile_metrics["overflow"] <= 1, mobile_metrics
    assert mobile_metrics["titleVisible"] is True, mobile_metrics
    assert mobile_metrics["routeVisible"] is True, mobile_metrics
    mobile.close()

    calm = browser.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="reduce")
    reduced = calm.new_page()
    reduced.goto(URL)
    wait_for_app(reduced, expects_video=False)
    assert reduced.locator("video").count() == 0
    assert reduced.locator(".media__still").count() == 1
    journey_scroll(reduced, 0.75)
    assert "Panas" in reduced.locator(".scene-copy h1").inner_text()
    reduced.screenshot(path=str(SCREEN_DIR / "reduced-motion.png"))
    calm.close()

    browser.close()
    print({
        "titles": titles,
        "videoTimes": [round(value, 2) for value in video_times],
        "video": video_state,
        "mobile": mobile_metrics,
        "screenshots": str(SCREEN_DIR),
    })
