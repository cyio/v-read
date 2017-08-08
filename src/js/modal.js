// ref: https://alligator.io/vuejs/jsx-render-functions/
export default {
  name: 'Modal',
	data: () => ({
	}),
  mounted () {
  },
	render (h) {
		return (
      <div class="modal-mask">
        <div class="modal-wrapper">
          <div class="modal-container">
						{this.$slots.default.length
							? this.$slots.default[0]
							: <h1>Your content here</h1>} 
          </div>
        </div>
      </div>
		)
	}
}
