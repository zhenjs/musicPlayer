import '../less/index.less';

//引入jq
import $ from './jquery.js'

//引入高斯模糊模块
import blurImg  from './gaussBlur.js';



function AudioManager  (data)  {
    //绑定数据
    this.dataList = data;

    //当前索引
    this.index = 0;

    //数据长度
    this.len = data.length;

    //创建audio对象

    this.audio = new Audio();
    this.audio.src = data[0].audio;
    this.audio.loop = true;

    //当前歌曲总长
    this.duration = data[0].duration;


    //是否播放

    this.isPlay = false;

    //喜欢按钮数组
    this.arrLike = [0, 0, 0, 0, 0];

}


AudioManager.prototype = {
    //播放下一首
    playNext: function () {
        //判断是否为最后一首
        this.index == this.len - 1? this.index = 0 : this.index++;

        //重新设置信息
        this.setInfo();

    },

    //播放上一首
    playPrev: function () {
        this.index == 0 ? this.index = this.len - 1 : this.index--;
        this.setInfo();
    },

    //播放指定的一首歌
    playIndex: function (index) {
        this.index = index;
        this.setInfo();
        this.play();
    },

    //播放暂停歌曲

    play: function () {
        this.audio.play();
        this.isPlay = true;
        $('.img-wrap img')[0].style.animationPlayState = 'running';
    },

    pause: function () {
        this.audio.pause();
        this.isPlay = false;
        $('.img-wrap img')[0].style.animationPlayState = 'paused';
    },

    //设置当前歌曲信息and是否播放
    setInfo: function () {
        //获取当前歌曲信息
        var data = this.dataList[this.index];
        this.duration = data.duration;
        this.audio.src = data.audio;
        
        if(this.isPlay) {
            this.audio.play();
        }
    },

    //返回当前歌曲时间
    returnCurTime: function (ratio) {
        return ratio ? Math.round(ratio * this.duration) : Math.round(this.audio.currentTime);
    },
    returnRatio: function () {
        return this.audio.currentTime / this.duration;
    },

    //返回当前数据
    returnInfo: function () {
        return this.dataList[this.index];
    },

}
//控制器用自执行函数封装，给出唯一接口
var controlManager = (function () {
    let audioManager,
        frameId,
        dragTime;
    //获取节点
    const $songImg = $('.img-wrap img'),
          $songInfo = $('.song-info'),
          $songDuration = $('.all-time'),
          $songCurTime = $('.cur-time'),
          $likeBtn = $('.like-btn'),
          $prevBtn = $('.prev-btn'),
          $playBtn = $('.play-btn'),
          $nextBtn = $('.next-btn'),
          $listBtn = $('.list-btn'),
          $closeBtn = $('.close-btn'),
          $slidePoint = $('.slide-point'),
          $slideWrap = $('.pro-wrap')[0],
          $slideTop = $('.pro-top')[0],
          $li = $('.play-list li'),
          $list = $('.play-list')[0];

    
    //格式化时间
    function formatTime (duration) {
        let minute = Math.floor(duration / 60),
            second = duration - minute * 60;
        if(minute < 10) {
            minute = '0' + minute;  
        };
        if(second < 10) {
            second = '0' + second;
        };
        return minute + ':' + second;
    }

    //设置模糊背景和专辑图片
    function setImage (img) {
        const image = new Image();
        image.onload = function () {
            blurImg(image, $('.content-wrap'));
            
        } 
        image.src = img;
        
        //此处用$songImg.src = xx无法切换图片
        $songImg.attr('src', img);
        

    }

    //设置歌曲信息 
    function setInfo (info) {
        const html = '<h1 class="song-name">'+ info.song +'</h1>' +
                '<h3 class="singer-name">'+ info.singer +'</h3>' +
                '<h3 class="album-name">'+ info.album +'</h3>' +
                '<h3 class="rhythm">'+ info.rhythm +'</h3>' +
                '<h3 class="lyric">'+ info.lyric +'</h3>';
        $songInfo.html(html);
    }

    //设置进度条移动函数

    function setSlideMove (ratio) {
        const translatePrecent = (ratio - 1) * 100;
        $slideTop.style.transform = 'translateX(' + translatePrecent + '%)';
    }
    //设置进度条信息
    function setProgress () {
        cancelAnimationFrame(frame);
        const frame = function () {
            const time = formatTime(audioManager.returnCurTime()),
                  ratio = audioManager.returnRatio();

            setSlideMove(ratio) ;
            $songCurTime.text(time);
            
            frameId = requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
        
    }

    //拖拽进度条的实现
    function dragPoint () {
        //获取Wrap的位置和宽度
        const offsetLeft = $slideWrap.offsetLeft,
              slideWidth = $slideWrap.offsetWidth;
        $slidePoint.on('touchstart', function () {
            cancelAnimationFrame(frameId);
        }).on('touchmove', function (e) {
            
            //获取滑动点的百分比
            const ratio = (e.changedTouches[0].clientX - offsetLeft) / slideWidth;

                //限制滑动距离
                if (ratio < 1 && ratio > 0) {
                    setSlideMove(ratio);
                }
                
                //获取当前进度条的时间
                dragTime = audioManager.returnCurTime(ratio);
                const time = formatTime(dragTime);
                $songCurTime.text(time);
            

        }).on('touchend', function () {
            dragTime ? audioManager.audio.currentTime = dragTime : 0;
            setProgress();
        })
    }

    //播放列表类的变更
    function setListColor (index, flag) {
        $li.removeClass('active').eq(index).addClass('active');
        if (flag) {
            audioManager.playIndex(index);
        }
    }

    //渲染页面
    function render () {
        //判断数组索引
        
        if(audioManager.arrLike[audioManager.index]) {
            $likeBtn.addClass('checked');
        } else {
            $likeBtn.removeClass('checked');
        }
        //获取歌曲信息
        const curInfo = audioManager.returnInfo();

        formatTime(curInfo.duration);
        setImage(curInfo.image);
        setInfo(curInfo);
        $songDuration.text(formatTime(curInfo.duration));

        $songCurTime.text('00:00');
        $slideTop.style.transform = 'translateX(-100%)';

    }
    //绑定事件函数
    function bundleEvent () {
        $likeBtn.on('click', function () {
            //切换class
            $(this).toggleClass('checked');  
            if($(this).hasClass('checked')) {
                //点击喜欢数组当前索引由0 -> 1
                audioManager.arrLike[audioManager.index] = 1;
            } else {
                audioManager.arrLike[audioManager.index] = undefined;
            }   
        });

        $playBtn.on('click', function () {
            $(this).toggleClass('playing');

            //通过判断class来决定是否播放
            $(this).hasClass('playing') ? audioManager.play() : audioManager.pause();
            if($(this).hasClass('playing')) {
                audioManager.play();
                setProgress();
            }else {
                audioManager.pause();
                cancelAnimationFrame(frameId);
            }
            
        });

        $nextBtn.on('click', function () {
            $songCurTime.text('00:00');
            audioManager.playNext();
            //与播放列表同步
            setListColor(audioManager.index);
            
            //重新渲染界面
            render();
        });
        
        $prevBtn.on('click', function () {
            $songCurTime.text('00:00');
            audioManager.playPrev();
            setListColor(audioManager.index);
            render();
        });
        //列表点击事件
        $closeBtn.on('click', function () {
            $list.style.display = 'none';
        })
        $listBtn.on('click', function () {
            $list.style.display = 'block';
        })

        
        $li.on('click', function () {
            const index = $(this).index();
            setListColor(index, true);
            render();    
            $playBtn.addClass('playing');

        })
    }
    //初始化UI
    function init (data) {
        audioManager = data;
        render();
        bundleEvent();
        dragPoint();
    }

    return {
        init,
    }
})()
const success = (data) => {
    const audioManager = new AudioManager(data);
    controlManager.init(audioManager);

}



const getData = (url, cb) => {
    $.ajax({
        type: 'GET',
        url: url,
        success: cb,
        error: (error) => {
            console.log('unkown Error')
        },

    })
}
getData('/data/data.json', success);







