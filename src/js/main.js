
$(function() {
	var myMenu = {
		// 导航页的所有点击事件
		myEvent:function(){
			$('.de-menu-btn').click(function(){
				var menuObj = $(this).find('div:first'),
					title = menuObj.attr('data-text'),
					isMenu1 = menuObj.hasClass('menu-1'),
					breadcrumbEle = $('.demo-header').find('.breadcrumb'),
					battit = '<li class="active"><a href="#">首页</a></li>',
					url = $(this).attr('data-url');
				breadcrumbEle.html('');
				$('.de-menu-btn').removeClass('btn-active');
				$(this).addClass('btn-active');
				if(title == '首页'){
					breadcrumbEle.html('<li class="active"><a href="#">首页</a></li>')
				}else{
					parentTitle = menuObj.parents().siblings('.menu-1').attr('data-text');
					battit = '<li><a href="#">首页</a></li><li><a href="#">'
					+parentTitle+'</a></li><li class="active">'+ title +'</li>';
					breadcrumbEle.html(battit);
				}
				$('#content-body').find('iframe').attr('src',url);
			})
			$('.menu-1').click(function(){
				var menu2Elem = $(this).siblings('.menu-2');
				if(menu2Elem.hasClass('active')){
					menu2Elem.hide("slow").removeClass('active')
				}else{
					menu2Elem.show("slow").addClass('active')
				}
			})
		},
		changeView:function(url){
			var contentEle = $('#content-body');
		},
		// 初始化
		init:function(){
			this.myEvent();
		}
	}
	myMenu.init();
})