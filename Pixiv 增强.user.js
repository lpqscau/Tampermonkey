// ==UserScript==
// @name        Pixiv 增强
// @namespace   https://github.com/Ahaochan/Tampermonkey
// @version     0.0.2
// @description 屏蔽广告, 查看热门图片, 按收藏数搜索, 下载gif、多图, 显示画师id。github:https://github.com/Ahaochan/Tampermonkey，欢迎star和fork。
// @author      Ahaochan
// @match       *://*.pixiv.net*
// @match       *://*.pixiv.net/**
// @grant       GM_xmlhttpRequest
// @require     https://code.jquery.com/jquery-2.2.4.min.js
// @require     https://cdn.bootcss.com/jszip/3.1.4/jszip.min.js
// @require     https://cdn.bootcss.com/FileSaver.js/1.3.2/FileSaver.min.js
// ==/UserScript==

(function ($) {
    'use strict';

    // 删除广告、查看热门图片
    (function () {
        // 删除广告
        $('._premium-lead-tag-search-bar').hide();
        // 查看热门图片
        $('.popular-introduction-overlay').hide();
    })();

    // 按收藏数搜索
    (function () {
        $('.navigation-menu-right').append(
            '<div class="menu-group">' +
            '    <a class="menu-item js-click-trackable-later">' +
            '           <img class="_howto-icon" src="https://source.pixiv.net/www/images/knowhow/icon/howto-brush.svg?20171004">' +
            '           <span class="label">收藏人数：</span>' +
            '           <select id="ahao_favourite_num_select">' +
            '               <option value=""></option>' +
            '               <option value="10000users入り">10000users入り</option>' +
            '               <option value="5000users入り" > 5000users入り</option>' +
            '               <option value="1000users入り" > 1000users入り</option>' +
            '               <option value="500users入り"  >  500users入り</option>' +
            '               <option value="300users入り"  >  300users入り</option>' +
            '               <option value="100users入り"  >  100users入り</option>' +
            '               <option value="50users入り"   >   50users入り</option>' +
            '           </select>' +
            '   </a>' +
            '</div>');

        // 如果已经有搜索字符串就在改变选项时直接搜索
        $('#ahao_favourite_num_select').on('change', function () {
            var $text = $('#suggest-input');
            if (!!$text.val()) {
                $('#suggest-container').submit();
            }
        });

        // 在提交搜索前处理搜索关键字
        $('#suggest-container').submit(function () {
            var $text = $('#suggest-input');
            var $favourite = $('#ahao_favourite_num_select');
            // 去除旧的搜索选项
            $text.val($text.val().replace(/\d*users入り/, ''));
            // 添加新的搜索选项
            $text.val($text.val() + ' ' + $favourite.val());
        });
    })();

    // 下载图片
    (function () {
        if (!(location.href.indexOf('member_illust.php') !== -1)) {
            return;
        }
        // 获取参数
        var param = $('.bookmark_modal_thumbnail')
            .attr('data-src')
            .match(/img-master\/img([\s\S]*?)_/)
            [1];

        // 下载动图
        (function () {
            var hasGIF = !!$('div ._ugoku-illust-player-container').length;
            if (hasGIF) {
                var url = 'https://i.pximg.net/img-zip-ugoira/img' + param + '_ugoira600x600.zip';
                // 添加下载按钮
                $('div .bookmark-container').append(
                    '<a href="' + url + '" class="_bookmark-toggle-button add-bookmark">' +
                    '   <span class="bookmark-icon"></span><span class="description">下载动图</span>' +
                    '</a>');
            }
        })();

        // 下载多图
        (function () {
            var hasMore = !!$('a.read-more').length;
            if (hasMore) {
                var downloaded = 0;                             // 下载完成数量
                var num = $('a.read-more').text().match(/\d+/); // 下载目标数量

                // 添加下载按钮
                var $a = $('<a class="_bookmark-toggle-button add-bookmark">' +
                    '   <span class="bookmark-icon"></span><span class="description">下载中</span>' +
                    '</a>')
                    .on('click', function () {
                        if (downloaded < num) {
                            return;
                        }
                        zip.generateAsync({type: "blob", base64: true}).then(function (content) {
                            saveAs(content, "pic.zip"); // see FileSaver.js'
                        });
                    });
                $('div .bookmark-container').append($a);


                var zip = new JSZip();
                for (var i = 0; i < num; i++) {
                    (function (index) {
                        var url = 'https://i.pximg.net/img-master/img' + param + '_p' + index + '_master1200.jpg';
                        GM_xmlhttpRequest({
                            method: 'GET',
                            headers: {referer: 'https://www.pixiv.net/'},
                            overrideMimeType: 'text/plain; charset=x-user-defined',
                            url: url,
                            onload: function (xhr) {
                                var r = xhr.responseText,
                                    data = new Uint8Array(r.length),
                                    i = 0;
                                while (i < r.length) {
                                    data[i] = r.charCodeAt(i);
                                    i++;
                                }

                                var blob = new Blob([data], {type: 'image/jpeg'});

                                downloaded++;
                                zip.file('pic_' + index + '.jpg', blob, {binary: true});

                                if (downloaded == num) {
                                    $a.find('.description').text('下载完成');
                                } else {
                                    $a.find('.description').text('下载: ' + downloaded + '/' + num);
                                }
                            }
                        });
                    })(i);
                }
            }
        })();
    })();

    // 显示画师id
    (function () {
        if (!(location.href.indexOf('member_illust.php') !== -1 ||
            location.href.indexOf('member.php') !== -1  )) {
            return;
        }
        $('a.user-name').after('<span>ID: '+pixiv.context.userId+'</span>');
    })();
})(jQuery);
