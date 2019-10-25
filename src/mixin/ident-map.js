import Vue from 'vue'
import IdentityMap from '../util/identity-map'
import { identity, stubObject, keys } from '../util/minilo'

const INSTANCES_POOL = 'instances'

export default {
  INSTANCES_POOL,
  props: {
    /**
     * Unique key for saving to identity map
     * @type {string|number}
     * @experimental
     */
    ident: [String, Number],
  },
  data () {
    return {
      idents: stubObject(),
    }
  },
  computed: {
    selfIdent () {
      return this.makeSelfIdent()
    },
  },
  watch: {
    ident (value, prev) {
      if (prev && this.$identityMap.has(prev)) {
        this.$identityMap.unset(prev)
      }
      if (value && !this.$identityMap.has(value)) {
        this.$identityMap.set(value)
      }
    },
  },
  beforeCreate () {
    initIdentityMap()
  },
  destroyed () {
    this.unsetInstances()
  },
  methods: {
    /**
     * @param parts
     * @return {string|undefined}
     * @protected
     */
    makeSelfIdent (...parts) {
      if (!this.ident) return

      return this.makeIdent(this.ident, ...parts)
    },
    /**
     * @param parts
     * @return {string}
     */
    makeIdent (...parts) {
      return parts.filter(identity).join('.')
    },
    /**
     * Caches or reuse factory result in the identity map
     * and returns result.
     *
     * @param {string|undefined} ident
     * @param {function} factory
     * @returns {*}
     */
    instanceFactoryCall (ident, factory) {
      if (ident && this.$identityMap.has(ident, INSTANCES_POOL)) {
        return this.$identityMap.get(ident, INSTANCES_POOL)
      }

      const val = factory()

      if (ident) {
        this.idents[ident] = true
        this.$identityMap.set(ident, val, INSTANCES_POOL)
      }

      return val
    },
    /**
     * @param {string|undefined} ident
     * @returns {*}
     */
    getInstance (ident) {
      if (!ident) return

      return this.$identityMap.get(ident, INSTANCES_POOL)
    },
    /**
     * Unsets all self indets
     * @return {void}
     */
    unsetInstances () {
      keys(this.idents).forEach(ident => this.$identityMap.unset(ident, INSTANCES_POOL))
    },
  },
}

function initIdentityMap () {
  const imap = new IdentityMap()

  if (!('$identityMap' in Vue)) {
    Object.defineProperties(Vue, {
      $identityMap: {
        enumerable: true,
        get: () => imap,
      },
    })
  }

  if (!('$identityMap' in Vue.prototype)) {
    Object.defineProperties(Vue.prototype, {
      $identityMap: {
        enumerable: true,
        get: () => imap,
      },
    })
  }
}
